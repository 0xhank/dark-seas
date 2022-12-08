import { defineEnterSystem, Has } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { RenderDepth } from "../constants";
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

    const radius = phaserScene.add.circle(0, 0, worldRadius * positions.posHeight);

    radius.setStrokeStyle(50, 0xffffff);
    radius.setDepth(RenderDepth.Background1);

    // radius.setDisplayOrigin(0, 0);

    radiusGroup.add(radius);

    polygonRegistry.set("radiusGroup", radiusGroup);
  });
}
