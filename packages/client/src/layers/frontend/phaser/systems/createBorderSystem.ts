import { defineComponentSystem, setComponent } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createBorderSystem(phaser: PhaserLayer) {
  const {
    world,
    godEntity,
    components: { GameConfig, MapBounds },
    scene: { phaserScene, posHeight, posWidth, camera },
    utils: { getGroupObject },
  } = phaser;

  defineComponentSystem(world, GameConfig, (update) => {
    const worldSize = update.value[0]?.worldSize;
    if (!worldSize) return;
    const borderGroup = getGroupObject("borderGroup", true);

    const width = (worldSize * posHeight * 2 * 16) / 9;
    const height = worldSize * posWidth * 2;
    const border = phaserScene.add.rectangle(0, 0, width, height);
    border.setStrokeStyle(50, colors.whiteHex);
    border.setDepth(RenderDepth.Background1);
    borderGroup.add(border);

    const minX = -width / 2;
    const minY = -height / 2;
    const maxX = width / 2;
    const maxY = height / 2;

    camera.phaserCamera.setBounds(minX, minY, maxX - minX, maxY - minY);

    setComponent(MapBounds, godEntity, { left: minX, top: minY, right: maxX, bottom: maxY });
  });
}
