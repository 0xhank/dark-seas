import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import { defineComponentSystem } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { Sprites } from "../constants";
import { PhaserLayer } from "../types";

export function createPositionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position },
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

    const object = objectPool.get(update.entity, "Sprite");
    const { x, y } = tileCoordToPixelCoord({ x: position.x + 0.5, y: position.y + 0.5 }, tileWidth, tileHeight);
    const sprite = config.sprites[Sprites.Donkey];

    object.setComponent({
      id: Position.id,
      now: async (gameObject) => {
        const duration = 500;

        const pointsToGo = [
          { x: object.position.x, y },
          { x, y },
        ];

        await tween(
          {
            targets: gameObject,
            duration,
            props: { x, y },
            ease: Phaser.Math.Easing.Linear,
          },
          { keepExistingTweens: true }
        );
      },
      once: async (gameObject) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);
        gameObject.setPosition(x, y);
      },
    });
  });
}
