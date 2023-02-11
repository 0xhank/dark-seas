import { defineComponentSystem, defineRxSystem, setComponent } from "@latticexyz/recs";
import { POS_HEIGHT, POS_WIDTH, RenderDepth } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";

export function createBorderSystem(MUD: SetupResult) {
  const {
    world,
    godEntity,
    components: { GameConfig, MapBounds },
    scene: { phaserScene, camera },
    utils: { getGroupObject, secondsIntoTurn, getWorldDimsAtTime },
    network: { clock },
  } = MUD;

  defineComponentSystem(world, GameConfig, (update) => {
    const time = clock.currentTime;
    const dims = getWorldDimsAtTime(time);
    const borderGroup = getGroupObject("borderGroup", true);

    const width = dims.width * POS_HEIGHT * 2;
    const height = dims.height * POS_WIDTH * 2;
    const border = phaserScene.add.rectangle(0, 0, width, height);
    border.setStrokeStyle(50, colors.whiteHex);
    // border.setFillStyle(0xff0000);
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
    // if (secondsIntoTurn(clock.currentTime) != 0) return;

    const borderGroup = getGroupObject("borderGroup");
    const dims = getWorldDimsAtTime(clock.currentTime);
    const width = dims.width * POS_HEIGHT * 2;
    const height = dims.height * POS_HEIGHT * 2;

    phaserScene.tweens.add({
      targets: borderGroup.getChildren(),
      props: {
        displayHeight: height,
        displayWidth: width,
      },
      ease: Phaser.Math.Easing.Quadratic.InOut,
      duration: 2000,
    });
  });
}
