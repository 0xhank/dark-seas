import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getShipSprite } from "../../../../utils/ships";
import { MOVE_LENGTH, RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createShipSystem(phaser: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool, config, camera },
    },
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, OwnedBy, Health },
        utils: { getPlayerEntity },
        network: { connectedAddress },
      },
      backend: {
        components: { SelectedShip, SelectedMove, HoveredShip },
      },
    },
    polygonRegistry,
    positions,
  } = phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  defineEnterSystem(
    world,
    [Has(Health), Has(Length), Has(Position), Has(Rotation), Has(OwnedBy)],
    ({ entity: shipEntity }) => {
      const health = getComponentValueStrict(Health, shipEntity).value;
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const ownerId = getComponentValueStrict(OwnedBy, shipEntity).value;

      const ownerEntity = getPlayerEntity(ownerId);
      if (!ownerEntity) return;
      const playerEntity = getPlayerEntity();
      const object = objectPool.get(shipEntity, "Sprite");
      const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);
      // @ts-expect-error doesnt recognize a sprite as a number
      const sprite = config.sprites[spriteAsset];
      object.setComponent({
        id: `texture`,
        once: (ship) => {
          ship.setTexture(sprite.assetKey, sprite.frame);

          if (health == 0) {
            ship.setAlpha(0.5);
            ship.setDepth(RenderDepth.Foreground4);
          } else {
            ship.setAlpha(1);
            ship.setDepth(RenderDepth.Foreground3);
          }
        },
      });

      object.setComponent({
        id: "interactive",
        once: (ship) => {
          if (health == 0) {
            ship.off("pointerdown");
            ship.off("pointerover");
            ship.off("pointerout");
            ship.disableInteractive();
          } else {
            ship.setInteractive();
            ship.off("pointerdown");
            ship.off("pointerover");
            ship.off("pointerout");

            ship.on("pointerdown", () => setComponent(SelectedShip, GodEntityIndex, { value: shipEntity }));
            ship.on("pointerover", () => setComponent(HoveredShip, GodEntityIndex, { value: shipEntity }));
            ship.on("pointerout", () => removeComponent(HoveredShip, GodEntityIndex));
          }
        },
      });

      object.setComponent({
        id: "len",
        once: (sprite) => {
          const shipLength = length * positions.posWidth * 1.25;
          const shipWidth = shipLength / SHIP_RATIO;
          sprite.setDisplaySize(shipWidth, shipLength);
          sprite.setOrigin(0.5, 0.92);
        },
      });

      object.setComponent({
        id: "position-rotation",

        once: async (ship) => {
          const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

          ship.setAngle((rotation - 90) % 360);
          ship.setPosition(x, y);
        },
      });

      if (playerEntity == ownerEntity)
        camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);
    }
  );

  // LENGTH UPDATES
  defineComponentSystem(world, Length, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const length = update.value[0].value;
    const object = objectPool.get(update.entity, "Sprite");

    object.setComponent({
      id: "len",
      once: (sprite) => {
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        sprite.setDisplaySize(shipWidth, shipLength);
        sprite.setOrigin(0.5, 0.92);
      },
    });
  });

  // Position and Rotation updates
  defineSystem(world, [Has(Position), Has(Rotation)], (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const object = objectPool.get(update.entity, "Sprite");

    if (update.type == UpdateType.Exit) {
      object.setComponent({
        id: "interactive",
        once: (ship) => {
          ship.off("pointerdown");
          ship.off("pointerover");
          ship.off("pointerout");
          ship.disableInteractive();
        },
      });
      objectPool.remove(update.entity);
    }

    polygonRegistry.get(`projection-${update.entity}`)?.clear(true, true);
    objectPool.remove(`projection-${update.entity}`);
    removeComponent(SelectedMove, update.entity);
    if (update.entity == getComponentValue(SelectedShip, GodEntityIndex)?.value) {
      removeComponent(SelectedShip, GodEntityIndex);
    }

    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: "position-rotation",
      now: async (ship) => {
        if (update.type == UpdateType.Enter) return;
        await tween({
          targets: ship,
          duration: MOVE_LENGTH,
          props: {
            x,
            y,
            angle: {
              getEnd: function (target, key, value) {
                const start = target.angle % 360;
                const end = (rotation - 90) % 360;
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

          ease: Phaser.Math.Easing.Sine.InOut,
        });
      },
      once: async (ship) => {
        ship.setAngle((rotation - 90) % 360);
        ship.setPosition(x, y);
      },
    });
  });
}
