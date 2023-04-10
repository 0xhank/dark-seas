import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  EntityIndex,
  Has,
  UpdateType,
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  defineSystem,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { sprites } from "../phaser/config";
import { MOVE_LENGTH, POS_HEIGHT, POS_WIDTH, RenderDepth, SHIP_RATIO } from "../phaser/constants";
import { HoverType, SetupResult, Sprites } from "../types";
import { getShipSprite } from "../utils/ships";

export function shipTextureSystems(MUD: SetupResult) {
  const {
    world,
    gameEntity,
    scene: { config, camera },
    components: {
      SelectedShip,
      SelectedMove,
      HoveredSprite,
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
      CurrentGame,
    },
    utils: { getSpriteObject, destroySpriteObject, destroyGroupObject, getOwnerEntity, inGame },
  } = MUD;

  defineEnterSystem(
    world,
    [
      Has(HealthLocal),
      Has(MaxHealth),
      Has(Length),
      Has(Position),
      Has(Rotation),
      Has(OwnedBy),
      Has(SailPosition),
      Has(CurrentGame),
    ],
    ({ entity: shipEntity, component }) => {
      console.log("in game: ", inGame(shipEntity));
      if (!inGame(shipEntity)) return;
      const maxHealth = getComponentValueStrict(MaxHealth, shipEntity).value;
      const health = getComponentValueStrict(HealthLocal, shipEntity).value;
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const ownerId = getComponentValueStrict(OwnedBy, shipEntity).value;

      const gameEntity = getOwnerEntity(ownerId);
      if (!gameEntity) return;
      const ownerEntity = getOwnerEntity();
      const object = getSpriteObject(shipEntity);
      const spriteAsset: Sprites = getShipSprite(gameEntity, health, maxHealth, ownerEntity == gameEntity);
      const sprite = sprites[spriteAsset];

      object.setTexture(sprite.assetKey, sprite.frame);

      object.setInteractive({ cursor: "pointer" });
      object.off("pointerup");
      object.on("pointerout", () => removeComponent(HoveredSprite, HoverType.SHIP));
      object.on("pointerover", () => setComponent(HoveredSprite, HoverType.SHIP, { value: shipEntity }));
      if (health == 0) {
        object.setAlpha(0.2);
        object.setDepth(RenderDepth.Foreground4);
      } else {
        object.setAlpha(1);
        object.setDepth(RenderDepth.Foreground3);
        object.on("pointerup", () => setComponent(SelectedShip, gameEntity, { value: shipEntity }));
      }

      const shipLength = length * POS_WIDTH * 1.25;
      const shipWidth = shipLength / SHIP_RATIO;
      object.setDisplaySize(shipWidth, shipLength);
      object.setOrigin(0.5, 0.92);

      const { x, y } = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

      object.setAngle((rotation - 90) % 360);
      object.setPosition(x, y);

      if (ownerEntity == gameEntity) camera.centerOn(position.x * POS_WIDTH, position.y * POS_HEIGHT);

      const onFire = getComponentValue(OnFire, shipEntity)?.value || 0;
      setComponent(OnFireLocal, shipEntity, { value: onFire });
      const damagedCannons = getComponentValue(DamagedCannons, shipEntity)?.value || 0;
      setComponent(DamagedCannonsLocal, shipEntity, { value: damagedCannons });
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
      setComponent(SailPositionLocal, shipEntity, { value: sailPosition });
    }
  );

  defineExitSystem(world, [Has(CurrentGame)], ({ entity: shipEntity }) => {
    destroySpriteObject(shipEntity);
    destroyGroupObject(shipEntity);
    destroyGroupObject(`sailbutton-${shipEntity}`);
    destroySpriteObject(`projection-${shipEntity}`);
    destroyGroupObject(`projection-${shipEntity}`);
    destroyGroupObject("activeShip");
    destroySpriteObject("hoverGhost");
  });

  // LENGTH UPDATES
  defineComponentSystem(world, Length, ({ entity: shipEntity, value: [newValue, oldValue] }) => {
    if (!inGame(shipEntity)) return;
    if (oldValue === undefined || newValue === undefined) return;

    const length = newValue.value;
    const object = getSpriteObject(shipEntity);

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
    if (!inGame(update.entity)) return;
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const object = getSpriteObject(update.entity);

    if (update.type == UpdateType.Exit) {
      object.off("pointerup");
      object.off("pointerover");
      object.off("pointerout");
      object.disableInteractive();
      destroySpriteObject(update.entity);
    }
    destroyGroupObject(`projection-${update.entity}`);
    removeComponent(SelectedMove, update.entity);
    if (update.entity == getComponentValue(SelectedShip, gameEntity)?.value) {
      removeComponent(SelectedShip, gameEntity);
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
