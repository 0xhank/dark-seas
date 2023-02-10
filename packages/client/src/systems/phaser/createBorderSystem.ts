import { defineComponentSystem, defineRxSystem, setComponent } from "@latticexyz/recs";
import { DELAY } from "../../layers/frontend/constants";
import { colors } from "../../layers/frontend/react/styles/global";
import { useMUD } from "../../MUDContext";
import { POS_HEIGHT, POS_WIDTH, RenderDepth } from "../../phaser/constants";

export function createBorderSystem() {
  const {
    world,
    godEntity,
    components: { GameConfig, MapBounds },
    scene: { phaserScene, camera },
    utils: { getGroupObject, secondsIntoTurn, getWorldDimsAtTurn, getTurn },
    network: { clock },
  } = useMUD();

  defineComponentSystem(world, GameConfig, (update) => {
    const dims = getWorldDimsAtTurn();
    const borderGroup = getGroupObject("borderGroup", true);

    const width = dims.width * POS_HEIGHT * 2;
    const height = dims.height * POS_WIDTH * 2;
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
