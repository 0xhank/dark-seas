import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
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
import { getMidpoint, getSternLocation } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { Animations, MOVE_LENGTH, RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createShipSystem(phaser: PhaserLayer) {
  const {
    world,
    godEntity,
    scene: { config, camera, posWidth, posHeight },
    components: {
      SelectedShip,
      SelectedMove,
      HoveredShip,
      HealthLocal,
      HealthBackend,
      OnFireLocal,
      DamagedCannonsLocal,
      SailPositionLocal,
      Position,
      Length,
      Rotation,
      OwnedBy,
      OnFire,
      DamagedCannons,
      SailPosition,
    },
    utils: { getSpriteObject, destroySpriteObject, destroyGroupObject, getPlayerEntity, outOfBounds, playSound },
  } = phaser;

  defineEnterSystem(
    world,
    [Has(HealthLocal), Has(Length), Has(Position), Has(Rotation), Has(OwnedBy), Has(SailPosition)],
    ({ entity: shipEntity }) => {
      const health = getComponentValueStrict(HealthLocal, shipEntity).value;
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
      object.off("pointerdown");
      object.off("pointerover");
      object.off("pointerout");
      if (health == 0) {
        object.disableInteractive();
      } else {
        object.setInteractive();
        object.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: shipEntity }));
        object.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: shipEntity }));
        object.on("pointerout", () => removeComponent(HoveredShip, godEntity));
      }

      const shipLength = length * posWidth * 1.25;
      const shipWidth = shipLength / SHIP_RATIO;
      object.setDisplaySize(shipWidth, shipLength);
      object.setOrigin(0.5, 0.92);

      const { x, y } = tileCoordToPixelCoord(position, posWidth, posHeight);

      object.setAngle((rotation - 90) % 360);
      object.setPosition(x, y);

      if (playerEntity == ownerEntity) camera.centerOn(position.x * posWidth, position.y * posHeight + 400);

      const onFire = getComponentValue(OnFire, shipEntity)?.value || 0;
      setComponent(OnFireLocal, shipEntity, { value: onFire });
      const damagedCannons = getComponentValue(DamagedCannons, shipEntity)?.value || 0;
      setComponent(DamagedCannonsLocal, shipEntity, { value: damagedCannons });
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
      setComponent(SailPositionLocal, shipEntity, { value: sailPosition });
    }
  );

  // LENGTH UPDATES
  defineComponentSystem(world, Length, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const length = update.value[0].value;
    const object = getSpriteObject(update.entity);

    const oldLength = object.displayHeight;
    const newLength = length * posWidth * 1.25;
    const oldScale = object.scale;

    const shipWidth = newLength / SHIP_RATIO;

    tween({
      targets: object,
      duration: 2000,
      delay: 1000,
      props: {
        scale: (newLength / oldLength) * oldScale,
      },
      onComplete: () => {
        object.setDisplaySize(shipWidth, newLength);
        object.setOrigin(0.5, 0.92);
      },
    });
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
    if (update.entity == getComponentValue(SelectedShip, godEntity)?.value) {
      removeComponent(SelectedShip, godEntity);
    }

    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);

    if (update.type == UpdateType.Enter) return;

    move(update.entity, object, position, rotation);
  });

  async function move(shipEntity: EntityIndex, object: Phaser.GameObjects.Sprite, position: Coord, rotation: number) {
    const coord = tileCoordToPixelCoord(position, posWidth, posHeight);

    await tween({
      targets: object,
      duration: MOVE_LENGTH,
      props: {
        x: coord.x,
        y: coord.y,
        angle: {
          getEnd: function (target) {
            const start = target.angle % 360;
            const end = (rotation - 90) % 360;
            let diff = end - start;
            if (diff < -180) diff += 360;
            else if (diff > 180) diff -= 360;
            return start + diff;
          },
          getStart: function (target) {
            return target.angle % 360;
          },
        },
      },

      ease: Phaser.Math.Easing.Sine.InOut,
    });

    const length = getComponentValueStrict(Length, shipEntity).value;

    if (outOfBounds(position) || outOfBounds(getSternLocation(position, rotation, length))) {
      const midpoint = getShipMidpoint(shipEntity);
      const healthLocal = getComponentValueStrict(HealthLocal, shipEntity).value;
      setComponent(HealthLocal, shipEntity, { value: healthLocal - 1 });
      setComponent(HealthBackend, shipEntity, { value: healthLocal - 1 });

      const explosionId = `explosion-move-${shipEntity}`;
      const explosion = getSpriteObject(explosionId);
      explosion.setOrigin(0.5, 0.5);
      explosion.setPosition(midpoint.x, midpoint.y);
      explosion.setDepth(RenderDepth.UI5);
      playSound("impact_ship_1", Category.Combat);

      explosion.play(Animations.Explosion);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      destroySpriteObject(explosionId);
      setComponent(SailPositionLocal, shipEntity, { value: 0 });
    }

    object.setAngle((rotation - 90) % 360);
    object.setPosition(coord.x, coord.y);
  }

  function getShipMidpoint(shipEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
    const length = getComponentValue(Length, shipEntity)?.value || 10;
    const midpoint = getMidpoint(position, rotation, length);

    return tileCoordToPixelCoord(midpoint, posWidth, posHeight);
  }
}
