import {
  defineComponent,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  namespaceWorld,
  Type,
} from "@latticexyz/recs";
import { defineNumberComponent, defineStringComponent } from "@latticexyz/std-client";

import { Action, Phase } from "../../types";
import { NetworkLayer } from "../network";
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
    SelectedActions: defineComponent(world, { value: Type.NumberArray }, { id: "Actions" }),
    CommittedMoves: defineStringComponent(world, { id: "Committed Moves" }),
  };
  // --- SETUP ----------------------------------------------------------------------

  const {
    utils: { getGameConfig, getPhase },
    components: { OnFire, Leak, DamagedMast, SailPosition },
  } = network;

  // --- UTILITIES ------------------------------------------------------------------
  function secondsUntilNextPhase(time: number, delay = 0) {
    const gameConfig = getGameConfig();
    const phase = getPhase(delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor((time + delay) / 1000) - parseInt(gameConfig.startTime);
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

  function checkActionPossible(action: Action, ship: EntityIndex): boolean {
    const onFire = getComponentValue(OnFire, ship)?.value;
    if (action == Action.ExtinguishFire && !onFire) return false;
    if (action == Action.FireRight && onFire) return false;
    if (action == Action.FireLeft && onFire) return false;

    if (action == Action.RepairLeak && !getComponentValue(Leak, ship)) return false;
    if (action == Action.RepairMast && !getComponentValue(DamagedMast, ship)) return false;

    const sailPosition = getComponentValueStrict(SailPosition, ship).value;
    if (action == Action.LowerSail && sailPosition != 2) return false;
    if (action == Action.RaiseSail && sailPosition != 1) return false;
    if (action == Action.RepairSail && sailPosition > 0) return false;

    return true;
  }

  // --- SYSTEMS --------------------------------------------------------------

  // --- API ------------------------------------------------------------------------

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    parentLayers: { network },
    utils: { checkActionPossible, secondsUntilNextPhase },
    components,
  };

  // --- SYSTEMS --------------------------------------------------------------------

  return context;
}
