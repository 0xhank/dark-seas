import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createBorderSystem(phaser: PhaserLayer) {
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

  defineComponentSystem(world, GameConfig, (update) => {
    const worldSize = update.value[0]?.worldSize;
    if (!worldSize) return;
    let borderGroup = polygonRegistry.get("borderGroup");
    if (!borderGroup) borderGroup = phaserScene.add.group();

    const border = phaserScene.add.rectangle(
      0,
      0,
      worldSize * positions.posHeight * 2,
      worldSize * positions.posHeight * 2
    );
    border.setStrokeStyle(50, colors.whiteHex);
    border.setDepth(RenderDepth.Background1);
    borderGroup.add(border);

    polygonRegistry.set("borderGroup", borderGroup);
  });
}
