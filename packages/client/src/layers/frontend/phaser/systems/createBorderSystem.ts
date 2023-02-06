import { defineComponentSystem, defineRxSystem, setComponent } from "@latticexyz/recs";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createBorderSystem(phaser: PhaserLayer) {
  const {
    world,
    godEntity,
    components: { GameConfig, MapBounds },
    scene: { phaserScene, posHeight, posWidth, camera },
    utils: { getGroupObject, secondsIntoTurn, getWorldDimsAtTurn, getTurn },
    network: { clock },
  } = phaser;

  defineComponentSystem(world, GameConfig, (update) => {
    const dims = getWorldDimsAtTurn();
    const borderGroup = getGroupObject("borderGroup", true);

    const width = dims.width * posHeight * 2;
    const height = dims.height * posWidth * 2;
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

  defineRxSystem(world, clock.time$, () => {
    if (secondsIntoTurn(DELAY) != 0) return;

    const formerTurn = (getTurn(DELAY) || 1) - 1;
    const formerDims = getWorldDimsAtTurn(formerTurn);
    const borderGroup = getGroupObject("borderGroup");
    const dims = getWorldDimsAtTurn();
    phaserScene.tweens.add({
      targets: borderGroup.getChildren(),
      props: {
        scaleX: dims.width / formerDims.width,
        scaleY: dims.height / formerDims.height,
        width: dims.width,
        height: dims.height,
      },
      ease: Phaser.Math.Easing.Quadratic.InOut,
      duration: 2000,
    });
  });
}
