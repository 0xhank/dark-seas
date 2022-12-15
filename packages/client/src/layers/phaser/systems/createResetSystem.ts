import { GodID } from "@latticexyz/network";
import { defineRxSystem, EntityIndex, getComponentValue, HasValue, removeComponent, runQuery } from "@latticexyz/recs";
import { Phase } from "../../../types";
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

    if (phase == undefined || gameConfig == undefined) return;

    const secondsUntilPhase = secondsUntilNextPhase(currentTime);
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    const yourShips = [...runQuery([HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

    if (phase == Phase.Commit) {
      if (secondsUntilPhase !== gameConfig.commitPhaseLength - 1) return;
      removeComponent(Selection, GodEntityIndex);

      yourShips.map((ship) => {
        removeComponent(SelectedMove, ship);
      });
    }

    if (phase == Phase.Reveal) {
      if (secondsUntilPhase !== gameConfig.revealPhaseLength - 1) return;
      removeComponent(Selection, GodEntityIndex);

      const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
      if (encoding) revealMove(encoding);
    }

    if (phase == Phase.Action) {
      if (secondsUntilPhase !== gameConfig.actionPhaseLength - 1) return;
      removeComponent(Selection, GodEntityIndex);

      removeComponent(CommittedMoves, GodEntityIndex);
      yourShips.map((ship) => {
        objectPool.remove(`projection-${ship}`);
        polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
        removeComponent(SelectedActions, ship);
      });
    }
  });
}
