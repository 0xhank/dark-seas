import { GodID } from "@latticexyz/network";
import { defineEnterSystem, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { TILE_HEIGHT } from "../constants";
import { PhaserLayer } from "../types";

export function createRadiusSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { GameConfig },
    utils: { getGameConfig },
  } = network;

  const {
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
    positions,
  } = phaser;

  defineEnterSystem(world, [Has(GameConfig)], (update) => {
    const worldRadius = getGameConfig()?.worldRadius;
    if (!worldRadius) return;

    let radiusGroup = polygonRegistry.get("radiusGroup");
    if (!radiusGroup) radiusGroup = phaserScene.add.group();

    const radius = phaserScene.add.circle(0, 0, worldRadius * TILE_HEIGHT);

    radius.setStrokeStyle(100, 0xffffff);
    radius.setZ(1000);

    // radius.setDisplayOrigin(0, 0);

    radiusGroup.add(radius);

    polygonRegistry.set("radiusGroup", radiusGroup);
  });
}
