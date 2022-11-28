import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { defineSystem, EntityIndex, getComponentValueStrict, Has, setComponent, UpdateType } from "@latticexyz/recs";
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
    if (update.type == UpdateType.Exit) {
      return;
    }

    const rangeGroup = polygonRegistry.get("rangeGroup");

    if (rangeGroup) rangeGroup.clear(true, true);

    const length = getComponentValueStrict(Length, update.entity).value;
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);
    if (!position) return console.warn("no position");

    const object = objectPool.get(update.entity, "Sprite");

    const sprite = config.sprites[Sprites.ShipBlack];

    const { x, y } = tileCoordToPixelCoord({ x: position.x, y: position.y }, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: Position.id,
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle(rotation - 90);
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
