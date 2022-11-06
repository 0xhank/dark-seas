import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
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
      once: (gameObject) => {
        gameObject.setRotation(rotation.value);
      },
    });
  });
}
