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
      Main: { config, camera },
    },
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, OwnedBy },
        utils: { getPlayerEntity },
      },
      backend: {
        components: { SelectedShip, SelectedMove, HoveredShip, LocalHealth },
      },
    },
    scenes: {
      Main: { positions },
    },
    utils: { getSpriteObject, destroySpriteObject, destroyGroupObject },
  } = phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  defineEnterSystem(
    world,
    [Has(LocalHealth), Has(Length), Has(Position), Has(Rotation), Has(OwnedBy)],
    ({ entity: shipEntity }) => {
      const health = getComponentValueStrict(LocalHealth, shipEntity).value;
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const ownerId = getComponentValueStrict(OwnedBy, shipEntity).value;

      const ownerEntity = getPlayerEntity(ownerId);
      if (!ownerEntity) return;
      const playerEntity = getPlayerEntity();
      const object = getSpriteObject(shipEntity);
      const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);
      // @ts-expect-error doesnt recognize a sprite as a number
      const sprite = config.sprites[spriteAsset];

      object.setTexture(sprite.assetKey, sprite.frame);

      if (health == 0) {
        object.setAlpha(0.5);
        object.setDepth(RenderDepth.Foreground4);
      } else {
        object.setAlpha(1);
        object.setDepth(RenderDepth.Foreground3);
      }

      if (health == 0) {
        object.off("pointerdown");
        object.off("pointerover");
        object.off("pointerout");
        object.disableInteractive();
      } else {
        object.setInteractive();
        object.off("pointerdown");
        object.off("pointerover");
        object.off("pointerout");

        object.on("pointerdown", () => setComponent(SelectedShip, GodEntityIndex, { value: shipEntity }));
        object.on("pointerover", () => setComponent(HoveredShip, GodEntityIndex, { value: shipEntity }));
        object.on("pointerout", () => removeComponent(HoveredShip, GodEntityIndex));
      }

      const shipLength = length * positions.posWidth * 1.25;
      const shipWidth = shipLength / SHIP_RATIO;
      object.setDisplaySize(shipWidth, shipLength);
      object.setOrigin(0.5, 0.92);

      const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

      object.setAngle((rotation - 90) % 360);
      object.setPosition(x, y);

      if (playerEntity == ownerEntity)
        camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);
    }
  );

  // LENGTH UPDATES
  defineComponentSystem(world, Length, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const length = update.value[0].value;
    const object = getSpriteObject(update.entity);

    const shipLength = length * positions.posWidth * 1.25;
    const shipWidth = shipLength / SHIP_RATIO;
    object.setDisplaySize(shipWidth, shipLength);
    object.setOrigin(0.5, 0.92);
  });

  // Position and Rotation updates
  defineSystem(world, [Has(Position), Has(Rotation)], (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const object = getSpriteObject(update.entity);

    if (update.type == UpdateType.Exit) {
      object.off("pointerdown");
      object.off("pointerover");
      object.off("pointerout");
      object.disableInteractive();
      destroySpriteObject(update.entity);
    }

    destroyGroupObject(`projection-${update.entity}`);
    destroySpriteObject(`projection-${update.entity}`);
    removeComponent(SelectedMove, update.entity);
    if (update.entity == getComponentValue(SelectedShip, GodEntityIndex)?.value) {
      removeComponent(SelectedShip, GodEntityIndex);
    }

    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    if (update.type == UpdateType.Enter) return;
    async function move() {
      await tween({
        targets: object,
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
      object.setAngle((rotation - 90) % 360);
      object.setPosition(x, y);
    }
    move();
  });
}
