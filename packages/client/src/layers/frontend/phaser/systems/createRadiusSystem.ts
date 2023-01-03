import { defineEnterSystem, Has } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createRadiusSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { GameConfig },
        utils: { getGameConfig },
      },
    },
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

    radius.setStrokeStyle(50, colors.whiteHex);
    radius.setDepth(RenderDepth.Background1);
    radiusGroup.add(radius);

    polygonRegistry.set("radiusGroup", radiusGroup);
  });
}
