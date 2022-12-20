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
        utils: { getPlayerEntity, getPhase, getGameConfig },
        api: { submitActions },
        network: { clock },
      },
      backend: {
        components: { SelectedMove, SelectedActions, CommittedMoves },
        api: { commitMove, revealMove },
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
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;

        commitMove(shipsAndMoves.ships, shipsAndMoves.moves);
      }
    }

    // AFTER DELAY: reveal moves
    if (phase == Phase.Reveal) {
      // AFTER DELAY
      if (timeToNextPhase == gameConfig.revealPhaseLength - DELAY) {
        const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
        if (encoding) revealMove(encoding);
      }
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
        const shipsAndActions = getPlayerShipsWithActions();
        if (!shipsAndActions) return;
        submitActions(
          shipsAndActions.ships.map((ship) => world.entities[ship]),
          shipsAndActions.actions
        );
      }
    }
  });
}
