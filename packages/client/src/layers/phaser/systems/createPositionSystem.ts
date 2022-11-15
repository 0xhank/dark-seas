import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { deg2rad } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { Sprites } from "../constants";
import { PhaserLayer } from "../types";

const shipWidth = 2;

export function createPositionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Length, Rotation },
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
    components: { SelectedShip },
  } = phaser;

  defineSystem(world, [Has(Position), Has(Rotation), Has(Length)], (update) => {
    if (update.type == UpdateType.Exit) {
      return;
    }

    const length = getComponentValueStrict(Length, update.entity).value;
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);
    if (!position) return console.warn("no position");

    const object = objectPool.get(update.entity, "Rectangle");
    const { x, y } = tileCoordToPixelCoord({ x: position.x + 0.5, y: position.y + 0.5 }, tileWidth, tileHeight);

    object.setComponent({
      id: Position.id,
      once: async (gameObject: Phaser.GameObjects.Rectangle) => {
        console.log("game object is:", gameObject);
        gameObject.setFillStyle(0xffff00, 1);
        gameObject.setSize(length * tileWidth, shipWidth * tileHeight);
        gameObject.setPosition(x, y);
        gameObject.setOrigin(1, 0.5);

        console.log(`rotation of ship ${update.entity}: ${rotation}`);
        gameObject.setRotation(deg2rad(rotation));

        gameObject.setInteractive();
        gameObject.on("pointerdown", () => {
          console.log("you just clicked on entity", update.entity);
          const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

          setComponent(SelectedShip, GodEntityIndex, { value: update.entity });
        });
      },
    });
  });
}
