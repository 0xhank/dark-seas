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
    polygonRegistry,
  } = phaser;

  defineSystem(world, [Has(Position), Has(Rotation), Has(Length)], (update) => {
    if (update.type == UpdateType.Exit) {
      return;
    }

    const rangeGroup = polygonRegistry.get("rangeGroup");

    if (rangeGroup) rangeGroup.clear(true, true);

    const length = getComponentValueStrict(Length, update.entity).value;
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);
    if (!position) return console.warn("no position");

    const object = objectPool.get(update.entity, "Rectangle");
    const { x, y } = tileCoordToPixelCoord({ x: position.x, y: position.y }, tileWidth, tileHeight);

    object.setComponent({
      id: Position.id,
      once: async (gameObject: Phaser.GameObjects.Rectangle) => {
        gameObject.setFillStyle(0xe97451, 1);
        gameObject.setSize(length * tileWidth, shipWidth * tileHeight);
        gameObject.setPosition(x, y);
        gameObject.setOrigin(1, 0.5);

        gameObject.setAngle(rotation);

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
