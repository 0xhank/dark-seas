import {
  defineComponent,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  namespaceWorld,
  runQuery,
  Type,
} from "@latticexyz/recs";
import { createActionSystem, defineNumberComponent, defineStringComponent } from "@latticexyz/std-client";
import { curry } from "lodash";

import { Action, ActionType, Phase } from "../../types";
import { NetworkLayer } from "../network";
import { commitMove } from "./api/commitMove";
import { revealMove } from "./api/revealMove";
import { spawnPlayer } from "./api/spawnPlayer";
import { submitActions } from "./api/submitActions";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createBackendLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "backend");
  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
    SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
    HoveredShip: defineNumberComponent(world, { id: "HoveredShip" }),
    SelectedActions: defineComponent(
      world,
      { actionTypes: Type.NumberArray, specialEntities: Type.EntityArray },
      { id: "Actions" }
    ),
    CommittedMoves: defineStringComponent(world, { id: "CommittedMoves" }),
  };
  // --- SETUP ----------------------------------------------------------------------

  const {
    utils: { getGameConfig, getPhase, getPlayerEntity },
    components: { OnFire, Leak, DamagedMast, SailPosition, Ship, OwnedBy },
    network: { connectedAddress },
  } = network;

  // --- UTILITIES ------------------------------------------------------------------
  function secondsUntilNextPhase(time: number, delay = 0) {
    const gameConfig = getGameConfig();
    const phase = getPhase(delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor(time / 1000) + delay - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    const secondsIntoTurn = gameLength % turnLength;

    const phaseEnd =
      phase == Phase.Commit
        ? gameConfig.commitPhaseLength
        : phase == Phase.Reveal
        ? gameConfig.commitPhaseLength + gameConfig.revealPhaseLength
        : turnLength;

    return phaseEnd - secondsIntoTurn;
  }

  function checkActionPossible(action: ActionType, ship: EntityIndex): boolean {
    const onFire = getComponentValue(OnFire, ship)?.value;

    if (action == ActionType.None) return false;
    if (action == ActionType.ExtinguishFire && !onFire) return false;
    // if ([ActionType.FireRight, ActionType.FireLeft, ActionType.FireForward].includes(action) && onFire) return false;

    if (action == ActionType.RepairLeak && !getComponentValue(Leak, ship)) return false;
    if (action == ActionType.RepairMast && !getComponentValue(DamagedMast, ship)) return false;

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
  function getPlayerShipsWithMoves(player?: EntityIndex) {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedMove)])];
    if (ships.length == 0) return;
    const moves = ships.map((ship) => getComponentValueStrict(components.SelectedMove, ship).value as EntityIndex);
    return { ships, moves };
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
      secondsUntilNextPhase,
      getPlayerShips,
      getPlayerShipsWithMoves,
      getPlayerShipsWithActions,
    },
    components,
  };

  // --- SYSTEMS --------------------------------------------------------------------

  return context;
}
