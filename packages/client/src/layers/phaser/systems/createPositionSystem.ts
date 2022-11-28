import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineSystem,
  EntityIndex,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { SHIP_RATIO, Sprites } from "../constants";
import { PhaserLayer } from "../types";

export function createPositionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Length, Rotation },
  } = network;

  const {
    scenes: {
      Main: { objectPool, config },
    },
    components: { SelectedShip },
    polygonRegistry,
    positions,
  } = phaser;

  defineSystem(world, [Has(Position), Has(Rotation), Has(Length)], (update) => {
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    if (update.type == UpdateType.Exit) {
      return;
    }

    const rangeGroup = polygonRegistry.get("rangeGroup");
    const activeGroup = polygonRegistry.get("activeGroup");

    if (rangeGroup) rangeGroup.clear(true, true);
    if (activeGroup) activeGroup.clear(true, true);
    objectPool.remove("projection");
    removeComponent(SelectedShip, GodEntityIndex);

    const length = getComponentValueStrict(Length, update.entity).value;
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);

    const object = objectPool.get(update.entity, "Sprite");

    const sprite = config.sprites[Sprites.ShipBlack];

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: Position.id,
      now: async (gameObject) => {
        if (update.type !== UpdateType.Enter) {
          await tween({
            targets: gameObject,
            duration: 250,
            props: {
              x,
              y,
              angle: {
                getEnd: function (target, key, value) {
                  const start = target.angle % 360;
                  const end = (rotation - 90) % 360;

                  console.log(`start angle: ${start}, end angle: ${end}`);

                  let diff = end - start;

                  if (diff < -180) diff += 360;
                  else if (diff > 180) diff -= 360;

                  return start + diff;
                },

                getStart: function (target, key, value) {
                  return target.angle % 360;
                },
              },
            },

            ease: Phaser.Math.Easing.Linear,
          });
        }
      },
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle((rotation - 90) % 360);
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        gameObject.setOrigin(0.5, 0.92);
        gameObject.setDisplaySize(shipWidth, shipLength);
        gameObject.setPosition(x, y);

        gameObject.setInteractive();
        console.log("updated position");
        gameObject.on("pointerdown", () => {
          console.log("you just clicked on entity", update.entity);
          const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

          setComponent(SelectedShip, GodEntityIndex, { value: update.entity });
        });
      },
    });
  });
}
