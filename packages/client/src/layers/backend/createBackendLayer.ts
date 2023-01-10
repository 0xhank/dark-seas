import { GodID } from "@latticexyz/network";
import { createPerlin } from "@latticexyz/noise";
import {
  defineComponent,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  namespaceWorld,
  NotValue,
  runQuery,
  Type,
} from "@latticexyz/recs";
import { createActionSystem, defineNumberComponent, defineStringComponent } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { curry } from "lodash";

import { Action, ActionType, Move } from "../../types";
import { inRadius } from "../../utils/distance";
import { getFiringArea, getSternLocation, inFiringArea } from "../../utils/trig";
import { NetworkLayer } from "../network";
import { commitMove } from "./api/commitMove";
import { revealMove } from "./api/revealMove";
import { spawnPlayer } from "./api/spawnPlayer";
import { submitActions } from "./api/submitActions";
import { createSuccessfulActionSystem } from "./systems";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createBackendLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "backend");
  const perlin = await createPerlin();

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
    SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
    HoveredShip: defineNumberComponent(world, { id: "HoveredShip" }),
    HoveredAction: defineComponent(
      world,
      { shipEntity: Type.Number, actionType: Type.Number, specialEntity: Type.Number },
      { id: "HoveredAction" }
    ),
    HoveredMove: defineComponent(
      world,
      { shipEntity: Type.Number, moveCardEntity: Type.Number },
      { id: "HoveredMove" }
    ),
    SelectedActions: defineComponent(
      world,
      { actionTypes: Type.NumberArray, specialEntities: Type.EntityArray },
      { id: "Actions" }
    ),
    CommittedMoves: defineStringComponent(world, { id: "CommittedMoves" }),
    Targeted: defineNumberComponent(world, { id: "Targeted" }),
    ExecutedActions: defineComponent(
      world,
      { actionTypes: Type.NumberArray, specialEntities: Type.EntityArray },
      { id: "ExecutedActions" }
    ),
  };
  // --- SETUP ----------------------------------------------------------------------

  const {
    utils: { getPlayerEntity, getGameConfig },
    components: { OnFire, DamagedCannons, SailPosition, Ship, OwnedBy, Range, Position, Rotation, Length },
    network: { connectedAddress },
  } = network;

  // --- UTILITIES ------------------------------------------------------------------

  function isMyShip(shipEntity: EntityIndex): boolean {
    const owner = getComponentValue(OwnedBy, shipEntity)?.value;
    const myAddress = connectedAddress.get();
    if (!owner || !myAddress) return false;
    return owner == myAddress;
  }

  function checkActionPossible(action: ActionType, ship: EntityIndex): boolean {
    const damagedCannons = getComponentValue(DamagedCannons, ship)?.value;

    if (action == ActionType.None) return false;
    if (action == ActionType.ExtinguishFire && !getComponentValue(OnFire, ship)?.value) return false;
    if (action == ActionType.Fire && damagedCannons) return false;
    if (action == ActionType.Load && damagedCannons) return false;

    if (action == ActionType.RepairCannons && !getComponentValue(DamagedCannons, ship)) return false;

    const sailPosition = getComponentValueStrict(SailPosition, ship).value;
    if (action == ActionType.LowerSail && sailPosition != 2) return false;
    if (action == ActionType.RaiseSail && sailPosition != 1) return false;
    if (action == ActionType.RepairSail && sailPosition > 0) return false;

    return true;
  }

  function getPlayerShips(player?: EntityIndex) {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[player] })])];
    if (ships.length == 0) return;

    return ships;
  }
  function getPlayerShipsWithMoves(player?: EntityIndex): Move[] | undefined {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedMove)])];
    if (ships.length == 0) return;
    const moves = ships.map((ship) => {
      const move = getComponentValueStrict(components.SelectedMove, ship).value as EntityIndex;
      return {
        shipEntity: world.entities[ship],
        moveCardEntity: world.entities[move],
      };
    });
    return moves;
  }

  function getTargetedShips(cannonEntity: EntityIndex): EntityIndex[] {
    const shipID = getComponentValue(OwnedBy, cannonEntity)?.value;
    if (!shipID) return [];
    const shipEntity = world.entityToIndex.get(shipID);

    const address = connectedAddress.get() as EntityID;
    if (!address || !shipEntity) return [];

    const length = getComponentValueStrict(Length, shipEntity).value;
    const shipPosition = getComponentValueStrict(Position, shipEntity);
    const shipRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;

    const shipEntities = [...runQuery([Has(Ship), NotValue(OwnedBy, { value: address })])].filter((targetEntity) => {
      if (targetEntity == shipEntity) return false;

      const enemyPosition = getComponentValueStrict(Position, targetEntity);
      const enemyRotation = getComponentValueStrict(Rotation, targetEntity).value;
      const sternPosition = getSternLocation(enemyPosition, enemyRotation, length);
      const range = getComponentValueStrict(Range, cannonEntity).value;

      const firingArea = getFiringArea(shipPosition, range, length, shipRotation, cannonRotation);

      const toTarget = inFiringArea(firingArea, enemyPosition) || inFiringArea(firingArea, sternPosition);
      return toTarget;
    });

    return shipEntities;
  }

  function getPlayerShipsWithActions(player?: EntityIndex) {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [
      ...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedActions)]),
    ];
    if (ships.length == 0) return;

    return ships.reduce((prevActions: Action[], ship: EntityIndex) => {
      const actions = getComponentValueStrict(components.SelectedActions, ship);
      const actionTypes = actions.actionTypes;
      const specialEntities = actions.specialEntities;
      const finalActions: [ActionType, ActionType] = [ActionType.None, ActionType.None];
      const finalSpecials: [EntityID, EntityID] = ["0" as EntityID, "0" as EntityID];
      if (actionTypes.length == 0) return prevActions;
      if (actionTypes.every((actionType) => actionType == ActionType.None)) return prevActions;

      actionTypes.forEach((val, idx) => {
        if (idx > 1) return;
        finalActions[idx] = val;
        finalSpecials[idx] = specialEntities[idx];
      });

      return [
        ...prevActions,
        {
          shipEntity: world.entities[ship],
          actionTypes: finalActions,
          specialEntities: finalSpecials,
        },
      ];
    }, []);
  }

  const outOfBoundsMap = new Map<string, boolean>();

  function outOfBounds(position: Coord) {
    const gameConfig = getGameConfig();
    if (!gameConfig) return false;

    if (!inRadius(position, gameConfig.worldRadius)) return true;

    const whirlpool = isWhirlpool(position, Number(gameConfig.perlinSeed));
    if (whirlpool) return true;
    return false;
  }

  function isWhirlpool(coord: Coord, perlinSeed: number): boolean {
    const coordStr = `${coord.x}-${coord.y}`;
    const retrievedVal = outOfBoundsMap.get(coordStr);
    if (retrievedVal != undefined) return retrievedVal;
    const denom = 50;
    const depth = perlin(coord.x + perlinSeed, coord.y + perlinSeed, 0, denom);
    console.log(`perlin: ${perlinSeed}`, "depth:", coord.x, coord.y, depth);
    const ret = depth * 100 < 26;
    outOfBoundsMap.set(coordStr, ret);
    return ret;
  }

  // --- SYSTEMS --------------------------------------------------------------
  const actions = createActionSystem(world, network.txReduced$);

  // --- API ------------------------------------------------------------------------
  const api = {
    spawnPlayer: curry(spawnPlayer)(network, actions),
    commitMove: curry(commitMove)(network, actions, components.CommittedMoves),
    revealMove: curry(revealMove)(network, actions),
    submitActions: curry(submitActions)(network, actions),
  };
  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    actions,
    api,
    parentLayers: { network },
    utils: {
      checkActionPossible,
      getPlayerShips,
      getPlayerShipsWithMoves,
      getPlayerShipsWithActions,
      getTargetedShips,
      isMyShip,
      outOfBounds,
      isWhirlpool,
    },
    components,
    godIndex: GodEntityIndex,
    perlin,
  };

  // --- SYSTEMS --------------------------------------------------------------------

  createSuccessfulActionSystem(context);
  return context;
}
