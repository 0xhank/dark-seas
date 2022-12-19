import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { defineSystem, getComponentValueStrict, Has } from "@latticexyz/recs";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createStatUpdateSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position },
      },
    },
    components: { UpdateQueue },
    polygonRegistry,

    scenes: {
      Main: { phaserScene, objectPool },
    },
    positions,
  } = phaser;

  defineSystem(world, [Has(UpdateQueue)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const updateQueue = getComponentValueStrict(UpdateQueue, update.entity).value;
    const barHeightOffset = 100;
    if (updateQueue.length == 0) return;
    const text = updateQueue[updateQueue.length - 1];

    let updateGroup = polygonRegistry.get(`update-${update.entity}`) || phaserScene.add.group();
    updateGroup = updateGroup.clear(true, true);

    const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    const interval = 1000;
    phaserScene.time.delayedCall(
      0,
      () => {
        const textObject = phaserScene.add.text(pixelPosition.x + 3, pixelPosition.y - barHeightOffset, text, {
          fontFamily: "sans-serif",
        });
        textObject.setTint(0xffffff);
        textObject.setScale(2);
        textObject.setDepth(RenderDepth.Foreground5);
        updateGroup.add(textObject);
        const object = objectPool.get(update.entity, "Sprite");

        object.setComponent({
          id: "flash-red",
          now: (sprite) => {
            sprite.setTint(0xff0000);

            setTimeout(() => sprite.clearTint(), 1000);
          },
        });
      },
      [],
      phaserScene
    );

    phaserScene.time.delayedCall(
      interval,
      () => {
        updateGroup?.clear(true, true);
      },
      [],
      phaserScene
    );
  });
}
