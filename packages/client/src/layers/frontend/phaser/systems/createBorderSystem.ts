import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createBorderSystem(phaser: PhaserLayer) {
  const {
    world,
    components: { GameConfig },
    scene: { phaserScene, posHeight },
    utils: { getGroupObject },
  } = phaser;

  defineComponentSystem(world, GameConfig, (update) => {
    const worldSize = update.value[0]?.worldSize;
    if (!worldSize) return;
    const borderGroup = getGroupObject("borderGroup", true);

    const border = phaserScene.add.rectangle(0, 0, worldSize * posHeight * 2, worldSize * posHeight * 2);
    border.setStrokeStyle(50, colors.whiteHex);
    border.setDepth(RenderDepth.Background1);
    borderGroup.add(border);
  });
}
