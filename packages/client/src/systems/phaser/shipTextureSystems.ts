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
import { sprites } from "../../phaser/config";
import { MOVE_LENGTH, POS_HEIGHT, POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Sprites } from "../../types";
import { getShipSprite } from "../../utils/ships";

export function shipTextureSystems(MUD: SetupResult) {
  const {
    world,
    godEntity,
    scene: { config, camera },
    components: {
      SelectedShip,
      SelectedMove,
      HoveredShip,
      HealthLocal,
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
      MaxHealth,
    },
    utils: { getSpriteObject, destroySpriteObject, destroyGroupObject, getPlayerEntity, outOfBounds, playSound },
    network: { clock },
  } = MUD;

  defineEnterSystem(
    world,
    [Has(HealthLocal), Has(MaxHealth), Has(Length), Has(Position), Has(Rotation), Has(OwnedBy), Has(SailPosition)],
    ({ entity: shipEntity }) => {
      const maxHealth = getComponentValueStrict(MaxHealth, shipEntity).value;
      const health = getComponentValueStrict(HealthLocal, shipEntity).value;
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const ownerId = getComponentValueStrict(OwnedBy, shipEntity).value;

      const ownerEntity = getPlayerEntity(ownerId);
      if (!ownerEntity) return;
      const playerEntity = getPlayerEntity();
      const object = getSpriteObject(shipEntity);
      const spriteAsset: Sprites = getShipSprite(ownerEntity, health, maxHealth, playerEntity == ownerEntity);
      const sprite = sprites[spriteAsset];

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
        object.setInteractive({ cursor: "pointer" });
        object.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: shipEntity }));
        object.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: shipEntity }));
        object.on("pointerout", () => removeComponent(HoveredShip, godEntity));
      }

      const shipLength = length * POS_WIDTH * 1.25;
      const shipWidth = shipLength / SHIP_RATIO;
      object.setDisplaySize(shipWidth, shipLength);
      object.setOrigin(0.5, 0.92);

      const { x, y } = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

      object.setAngle((rotation - 90) % 360);
      object.setPosition(x, y);

      if (playerEntity == ownerEntity) camera.centerOn(position.x * POS_WIDTH, position.y * POS_HEIGHT + 400);

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
    const newLength = length * POS_WIDTH * 1.25;
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
    const coord = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

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

    object.setAngle((rotation - 90) % 360);
    object.setPosition(coord.x, coord.y);
  }
}
