import { GodID } from "@latticexyz/network";
import { defineRxSystem, EntityIndex, HasValue, removeComponent, runQuery } from "@latticexyz/recs";
import { Phase } from "../../../constants";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createResetSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    components: { OwnedBy },
    utils: { getPlayerEntity, getPhase, getGameConfig },
    world,
  } = network;

  const {
    components: { Selection, SelectedMove, SelectedActions },
    scenes: {
      Main: { objectPool },
    },
    polygonRegistry,
    utils: { secondsUntilNextPhase },
  } = phaser;

  defineRxSystem(world, network.network.clock.time$, (currentTime) => {
    const phase = getPhase();

    if (phase == undefined) return;

    if (secondsUntilNextPhase(currentTime) !== 0) return;
    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    removeComponent(Selection, GodEntityIndex);

    if (phase !== Phase.Commit) {
      const yourShips = [...runQuery([HasValue(OwnedBy, { value: world.entities[playerEntity] })])];
      yourShips.map((ship) => {
        polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
        polygonRegistry.get(`activeGroup-${ship}`)?.clear(true, true);
        objectPool.remove(`projection-${ship}`);
        removeComponent(SelectedMove, ship);
        removeComponent(SelectedActions, ship);
      });
    }
  });
}
