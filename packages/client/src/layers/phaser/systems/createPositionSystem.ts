import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import { defineComponentSystem, getComponentValueStrict } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { Sprites } from "../constants";
import { PhaserLayer } from "../types";

export function createPositionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Width, Length },
  } = network;

  const {
    scenes: {
      Main: {
        objectPool,
        config,
        maps: {
          Main: { tileWidth, tileHeight },
        },
      },
    },
  } = phaser;

  defineComponentSystem(world, Position, (update) => {
    const position = update.value[0];
    if (!position) return console.warn("no position");

    const object = objectPool.get(update.entity, "Rectangle");
    const { x, y } = tileCoordToPixelCoord({ x: position.x + 0.5, y: position.y + 0.5 }, tileWidth, tileHeight);

    // const shipWidth = getComponentValueStrict(Width, update.entity);
    // const shipLength = getComponentValueStrict(Length, update.entity);

    object.setComponent({
      id: Position.id,
      // now: async (gameObject) => {
      //   const duration = 1000;

      //   await tween(
      //     {
      //       targets: gameObject,
      //       duration,
      //       props: { x, y },
      //       ease: Phaser.Math.Easing.Linear,
      //     },
      //     { keepExistingTweens: true }
      //   );
      // },
      once: async (gameObject) => {
        // gameObject.setScale(shipWidth.value, shipLength.value);
        // gameObject.setTexture(sprite.assetKey, sprite.frame);
        // gameObject.setPosition(x, y);

        gameObject.setFillStyle(0xffd09a, 1);
        gameObject.setSize(2 * tileWidth, 10 * tileHeight);
        gameObject.setPosition(x, y);
      },
    });
  });
}
