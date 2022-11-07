import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import { defineComponentSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { Sprites } from "../constants";
import { PhaserLayer } from "../types";

export function createRotationSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Rotation },
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

  defineComponentSystem(world, Rotation, (update) => {
    console.log("updating rotation");
    const rotation = update.value[0];
    if (!rotation) return console.warn("no rotation");

    const object = objectPool.get(update.entity, "Sprite");

    object.setComponent({
      id: Rotation.id,
      // now: async (gameObject) => {
      //   const duration = 500;
      //   await tween(
      //     {
      //       targets: gameObject,
      //       duration,
      //       props: { rotation },
      //       ease: Phaser.Math.Easing.Linear,
      //     },
      //     { keepExistingTweens: true }
      //   );
      // },
      once: (gameObject) => {
        gameObject.setOrigin(0.5, 0.5);
        gameObject.setAngle(rotation.value);
      },
    });
  });
}
