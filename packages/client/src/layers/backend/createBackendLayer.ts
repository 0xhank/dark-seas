import { GodID } from "@latticexyz/network";
import { createPerlin } from "@latticexyz/noise";

import {
  Component,
  defineComponent,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  namespaceWorld,
  NotValue,
  removeComponent,
  runQuery,
  Type,
} from "@latticexyz/recs";
import {
  createActionSystem,
  defineBoolComponent,
  defineNumberComponent,
  defineStringComponent,
} from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { Howl } from "howler";

import { Action, ActionType, Move } from "../../types";
import { inWorld } from "../../utils/distance";
import { getFiringArea, getSternLocation, inFiringArea } from "../../utils/trig";
import { NetworkLayer } from "../network";
import { commitMove } from "./api/commitMove";
import { revealMove } from "./api/revealMove";
import { spawnPlayer } from "./api/spawnPlayer";
import { submitActions } from "./api/submitActions";
import { Category, soundLibrary } from "./sound/library";
import { createBackendSystems } from "./systems";
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
    EncodedCommitment: defineStringComponent(world, { id: "EncodedCommitment" }),
    CommittedMove: defineComponent(world, { value: Type.Number }, { id: "CommittedMove" }),
    Targeted: defineNumberComponent(world, { id: "Targeted" }),

    ExecutedShots: defineComponent(
      world,
      { targets: Type.NumberArray, damage: Type.NumberArray },
      { id: "CommittedMove" }
    ),
    ExecutedLoad: defineBoolComponent(world, { id: "ExecutedLoad" }),
    ExecutedChangeSail: defineBoolComponent(world, { id: "ExecutedRaiseSail" }),
    ExecutedExtinguishFire: defineBoolComponent(world, { id: "ExecutedExtinguishFire" }),
    ExecutedRepairSail: defineBoolComponent(world, { id: "ExecutedRepairSail" }),
    ExecutedRepairCannons: defineBoolComponent(world, { id: "ExecutedRepairCannons" }),
    LeaderboardOpen: defineBoolComponent(world, {
      id: "LeaderboardOpen",
    }),
    LocalHealth: defineNumberComponent(world, { id: "LocalHealth" }),
  };
  // --- SETUP ----------------------------------------------------------------------

  const {
    utils: { getPlayerEntity, getGameConfig },
    components: { OnFire, DamagedCannons, SailPosition, Ship, OwnedBy, Range, Position, Rotation, Length },
    network: { connectedAddress },
    systemCallStreams,
  } = network;

  // SOUND

  function playSound(id: string, category: Category, loop = false, fade?: number) {
    let timeout;
    const sound = new Howl({
      src: [soundLibrary[category][id].src],
      volume: soundLibrary[category][id].volume,
      preload: true,
      loop: loop,
    });
    if (fade) {
      // Fade on begin and end

      // Init
      sound.play();
      sound.fade(0, 0.4, fade);
      sound.on("load", function () {
        const FADE_OUT_TIME = sound.duration() * 1000 - sound.seek() - fade;
        timeout = setTimeout(function () {
          sound.fade(0.4, 0, fade);
        }, FADE_OUT_TIME);
      });
    } else {
      sound.play();
    }
    return sound;
  }

  function startEnvironmentSoundSystem() {
    playSound("ocean", Category.Ambience, true);
  }

  startEnvironmentSoundSystem();

  const soundRegistry = new Map<string, Howl>();
  // --- UTILITIES ------------------------------------------------------------------

  function clearComponent(component: Component) {
    [...component.entities()].forEach((entity) => removeComponent(component, entity));
  }

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
      const enemyLength = getComponentValueStrict(Length, targetEntity).value;
      const sternPosition = getSternLocation(enemyPosition, enemyRotation, enemyLength);
      const range = getComponentValueStrict(Range, cannonEntity).value;

      const firingArea = getFiringArea(shipPosition, range, length, shipRotation, cannonRotation);

      const toTarget = inFiringArea(firingArea, enemyPosition) || inFiringArea(firingArea, sternPosition);
      return toTarget;
    });

    return shipEntities;
  }

  function getPlayerShipsWithActions(player?: EntityIndex): Action[] {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return [];
    const ships = [
      ...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedActions)]),
    ];
    if (ships.length == 0) return [];

    return ships.reduce((prevActions: Action[], ship: EntityIndex) => {
      const actions = getComponentValueStrict(components.SelectedActions, ship);
      const actionTypes = actions.actionTypes;
      if (actionTypes.length == 0) return prevActions;
      if (actionTypes.every((actionType) => actionType == ActionType.None)) return prevActions;

      const specialEntities = actions.specialEntities;
      const finalActions: [ActionType, ActionType] = [ActionType.None, ActionType.None];
      const finalSpecials: [EntityID, EntityID] = ["0" as EntityID, "0" as EntityID];

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

    if (!inWorld(position, gameConfig.worldSize)) return true;

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
    const ret = depth * 100 < 26;
    outOfBoundsMap.set(coordStr, ret);
    return ret;
  }

  // --- SYSTEMS --------------------------------------------------------------
  const actions = createActionSystem(world, network.txReduced$);

  // --- API ------------------------------------------------------------------------
  const api = {
    spawnPlayer: (name: string) => spawnPlayer(network, actions, name),
    commitMove: (moves: Move[]) => commitMove(network, actions, moves),
    revealMove: (encoding: string) => revealMove(network, actions, encoding),
    submitActions: (actionsToSubmit: Action[]) => submitActions(network, actions, getTargetedShips, actionsToSubmit),
  };
  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    actions,
    api,
    parentLayers: { network },
    soundRegistry,
    utils: {
      checkActionPossible,
      getPlayerShips,
      getPlayerShipsWithMoves,
      getPlayerShipsWithActions,
      getTargetedShips,
      isMyShip,
      outOfBounds,
      isWhirlpool,
      clearComponent,
      playSound,
    },
    components,
    godIndex: GodEntityIndex,
    perlin,
  };

  // --- SYSTEMS --------------------------------------------------------------------

  createBackendSystems(context);
  return context;
}
