import { GodID } from "@latticexyz/network";
import { defineRxSystem, EntityIndex, getComponentValue, removeComponent } from "@latticexyz/recs";
import { Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { PhaserLayer } from "../types";

export function createResetSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { LastMove, LastAction },
        utils: { getPlayerEntity, getPhase, getGameConfig, getTurn },
        network: { clock },
      },
      backend: {
        components: { SelectedMove, SelectedActions, CommittedMoves },
        api: { commitMove, revealMove, submitActions },
        utils: { secondsUntilNextPhase, getPlayerShipsWithMoves, getPlayerShipsWithActions, getPlayerShips },
      },
    },
    scenes: {
      Main: { objectPool },
    },
    polygonRegistry,
  } = phaser;

  defineRxSystem(world, clock.time$, (currentTime) => {
    const phase = getPhase(DELAY);
    const turn = getTurn(DELAY);
    const gameConfig = getGameConfig();

    if (phase == undefined || !gameConfig) return;

    const timeToNextPhase = secondsUntilNextPhase(currentTime, DELAY);

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    // START OF PHASE: clear previous turn's actions
    // END OF PHASE: submit moves
    if (phase == Phase.Commit) {
      // START OF PHASE
      if (timeToNextPhase == gameConfig.commitPhaseLength) {
        getPlayerShips()?.map((ship) => {
          objectPool.remove(`projection-${ship}`);
          polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
          removeComponent(SelectedActions, ship);
        });
      }

      // END OF PHASE
      if (timeToNextPhase == 1) {
        const committedMoves = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
        if (committedMoves) return;
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;
        commitMove(shipsAndMoves);
      }
    }

    // START OF PHASE: reveal moves
    // note: contract-side this occurs during the commit phase
    if (phase == Phase.Reveal) {
      if (timeToNextPhase !== gameConfig.revealPhaseLength) return;

      const lastMove = getComponentValue(LastMove, playerEntity)?.value;
      if (lastMove == turn) return;
      const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
      if (encoding) revealMove(encoding);
    }

    // START OF PHASE: clear move commitments
    // END OF PHASE: submit actions
    if (phase == Phase.Action) {
      // START OF PHASE
      if (timeToNextPhase == gameConfig.actionPhaseLength) {
        removeComponent(CommittedMoves, GodEntityIndex);
        getPlayerShips()?.map((ship) => {
          removeComponent(SelectedMove, ship);
        });
      }
      // END OF PHASE
      if (timeToNextPhase == 1) {
        const lastAction = getComponentValue(LastAction, playerEntity)?.value;
        if (lastAction == turn) return;
        const shipsAndActions = getPlayerShipsWithActions();

        if (shipsAndActions) submitActions(shipsAndActions);
      }
    }
  });
}
