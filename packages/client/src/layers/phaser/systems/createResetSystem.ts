import { GodID } from "@latticexyz/network";
import { defineRxSystem, EntityIndex, getComponentValue, HasValue, removeComponent, runQuery } from "@latticexyz/recs";
import { Phase } from "../../../constants";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createResetSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    components: { OwnedBy },
    utils: { getPlayerEntity, getPhase, getGameConfig },
    api: { revealMove },
    world,
  } = network;

  const {
    components: { Selection, SelectedMove, SelectedActions, CommittedMoves },
    scenes: {
      Main: { objectPool },
    },
    polygonRegistry,
    utils: { secondsUntilNextPhase },
  } = phaser;

  defineRxSystem(world, network.network.clock.time$, (currentTime) => {
    const phase = getPhase();
    const gameConfig = getGameConfig();

    if (phase == undefined) return;

    const secondsUntilPhase = secondsUntilNextPhase(currentTime);
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    if (phase == Phase.Reveal && secondsUntilPhase == gameConfig?.revealPhaseLength) {
      const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
      if (encoding) {
        revealMove(encoding);
      }
    }

    if (secondsUntilPhase !== 0) return;
    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    removeComponent(Selection, GodEntityIndex);

    const yourShips = [...runQuery([HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

    if (phase == Phase.Commit) {
      yourShips.map((ship) => {
        removeComponent(SelectedMove, ship);
      });
    }

    if (phase == Phase.Action) {
      yourShips.map((ship) => {
        removeComponent(SelectedActions, ship);
      });
    }

    if (phase == Phase.Reveal) {
      removeComponent(CommittedMoves, GodEntityIndex);
      yourShips.map((ship) => {
        objectPool.remove(`projection-${ship}`);
        polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
      });
    }
  });
}
