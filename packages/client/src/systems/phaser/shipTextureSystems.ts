import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
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
import { MOVE_LENGTH, POS_HEIGHT, POS_WIDTH, RenderDepth } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";

export function shipTextureSystems(MUD: SetupResult) {
  const {
    world,
    godEntity,
    scene: { camera, phaserScene },
    components: {
      SelectedShip,
      SelectedMove,
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
    utils: { createShip, destroySpriteObject, destroyGroupObject, getPlayerEntity, getShip },
  } = MUD;

  defineEnterSystem(
    world,
    [Has(HealthLocal), Has(MaxHealth), Has(Length), Has(Position), Has(Rotation), Has(OwnedBy), Has(SailPosition)],
    ({ entity: shipEntity, component }) => {
      const position = getComponentValueStrict(Position, shipEntity);
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const ownerId = getComponentValueStrict(OwnedBy, shipEntity).value;
      const length = getComponentValueStrict(Length, shipEntity).value;

      const ownerEntity = getPlayerEntity(ownerId);
      if (!ownerEntity) return;
      const playerEntity = getPlayerEntity();

      const shipObject = createShip(shipEntity);
      const { x, y } = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

      shipObject.setAngle(rotation - 90);
      shipObject.setScale(length / 6);
      shipObject.setDepth(RenderDepth.Foreground3);
      shipObject.setPosition(x, y);
      if (playerEntity == ownerEntity) camera.centerOn(position.x * POS_WIDTH, position.y * POS_HEIGHT);

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
    const object = getShip(update.entity);

    phaserScene.add.tween({
      targets: object,
      duration: 2000,
      delay: 1000,
      props: {
        scale: length / 6,
      },
    });
  });

  // Position and Rotation updates
  defineSystem(world, [Has(Position), Has(Rotation)], (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    const object = getShip(update.entity);

    if (update.type == UpdateType.Exit) {
      object.off("pointerup");
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

  async function move(
    shipEntity: EntityIndex,
    object: Phaser.GameObjects.Container,
    position: Coord,
    rotation: number
  ) {
    const coord = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

    phaserScene.add.tween({
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
      onComplete: () => {
        object.setAngle((rotation - 90) % 360);
        object.setPosition(coord.x, coord.y);
      },
      ease: Phaser.Math.Easing.Sine.InOut,
    });
  }
}
