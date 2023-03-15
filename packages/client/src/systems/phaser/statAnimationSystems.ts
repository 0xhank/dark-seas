import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineUpdateSystem,
  EntityIndex,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { Animations, POS_HEIGHT, POS_WIDTH, RenderDepth } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { getSternPosition, midpoint } from "../../utils/trig";

export function statAnimationSystems(MUD: SetupResult) {
  const {
    world,
    components: { Position, Rotation, Length, Cannon, OwnedBy, OnFireLocal, DamagedCannonsLocal },
    scene: { phaserScene },

    utils: {
      getSpriteObject,
      destroySpriteObject,
      getGroupObject,
      destroyGroupObject,
      renderCannonFiringArea,
      moveElement,
    },
  } = MUD;

  // ON FIRE UPDATES
  defineComponentSystem(world, OnFireLocal, (update) => {
    if (!update.value[0]) return;
    if (update.value[0].value == 0) {
      destroyFire(update.entity);
      return;
    }
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternPosition(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const firePositions = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < firePositions.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const { x, y } = tileCoordToPixelCoord(firePositions[i], POS_WIDTH, POS_HEIGHT);
      object.setAlpha(0);

      setTimeout(() => {
        object.setAlpha(1);
        object?.play(Animations.Fire);
      }, Math.random() * 1000);

      const xLoc = Math.random();
      const yLoc = Math.random();
      object.setOrigin(xLoc, yLoc);
      object.setScale(2);
      object.setPosition(x, y);
      object.setDepth(RenderDepth.UI4);
    }
  });

  defineUpdateSystem(world, [Has(OnFireLocal), Has(Position), Has(Rotation)], (update) => {
    const onFire = getComponentValueStrict(OnFireLocal, update.entity).value > 0;
    if (!onFire) return;
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternPosition(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const firePositions = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < firePositions.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const coord = tileCoordToPixelCoord(firePositions[i], POS_WIDTH, POS_HEIGHT);

      moveElement(object, coord);
    }
  });

  function destroyFire(shipEntity: EntityIndex) {
    for (let i = 0; i < 4; i++) {
      const spriteId = `${shipEntity}-fire-${i}`;
      destroySpriteObject(spriteId);
    }
  }

  // BROKEN CANNON UPDATES

  defineComponentSystem(world, DamagedCannonsLocal, (update) => {
    const shipEntity = update.entity;

    // exit or enter
    if (update.value[0] == undefined || update.value[1] == undefined) return;
    const improvement = update.value[0].value - update.value[1].value < 0;
    if (improvement && update.value[0].value !== 0) return;

    flashCannons(shipEntity, improvement ? colors.greenHex : colors.blackHex);
  });

  async function flashCannons(shipEntity: EntityIndex, tint: number) {
    const groupId = `flash-cannons-${shipEntity}`;
    const group = getGroupObject(groupId, true);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    const duration = 500;
    const repeat = -1;
    cannonEntities.forEach((cannonEntity) => {
      const rangeColor = { tint, alpha: 0.5 };
      renderCannonFiringArea(group, shipEntity, cannonEntity, rangeColor);
    });

    phaserScene.tweens.add({
      targets: group.getChildren(),
      props: {
        alpha: {
          from: 0,
          to: 0.6,
        },
      },
      ease: Phaser.Math.Easing.Linear,
      duration: duration,
      repeat: repeat,
      yoyo: true,
    });

    phaserScene.time.addEvent({
      delay: duration * 4,
      callback: function () {
        destroyGroupObject(groupId);
      },
      callbackScope: phaserScene,
    });
  }
}
