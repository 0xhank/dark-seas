import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineUpdateSystem,
  EntityIndex,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { getSternLocation, midpoint } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { colors } from "../../react/styles/global";
import { Animations, CANNON_SHOT_DELAY, MOVE_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";
import { renderFiringArea } from "./renderShip";

export function createStatAnimationSystem(layer: PhaserLayer) {
  const {
    world,
    components: { Position, Rotation, Length, Cannon, OwnedBy, HealthLocal, OnFireLocal, DamagedCannonsLocal },
    scene: { phaserScene, posWidth, posHeight },

    utils: { getSpriteObject, destroySpriteObject, getGroupObject, destroyGroupObject, isMyShip, playSound },
  } = layer;

  // ON FIRE UPDATES
  defineComponentSystem(world, OnFireLocal, (update) => {
    if (!update.value[0]) return;
    if (update.value[0].value == 0) {
      for (let i = 0; i < 4; i++) {
        const spriteId = `${update.entity}-fire-${i}`;
        destroySpriteObject(spriteId);
      }
      return;
    }
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const { x, y } = tileCoordToPixelCoord(fireLocations[i], posWidth, posHeight);
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
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const coord = tileCoordToPixelCoord(fireLocations[i], posWidth, posHeight);

      moveFire(object, coord);
    }
  });

  async function moveFire(object: Phaser.GameObjects.Sprite, coord: Coord) {
    await tween({
      targets: object,
      duration: MOVE_LENGTH,
      props: { x: coord.x, y: coord.y },
      ease: Phaser.Math.Easing.Sine.InOut,
    });
    object.setPosition(coord.x, coord.y);
  }

  defineUpdateSystem(world, [Has(HealthLocal)], ({ entity: shipEntity, value: [newComponent, oldComponent] }) => {
    if (!newComponent?.value || !oldComponent?.value) return;

    if (newComponent.value > oldComponent.value) {
      flashGreen(shipEntity);
    }

    if (newComponent?.value !== 0) return;

    for (let i = 0; i < 4; i++) {
      const spriteId = `${shipEntity}-fire-${i}`;
      destroySpriteObject(spriteId);
    }
  });

  async function flashGreen(shipEntity: EntityIndex) {
    const object = getSpriteObject(shipEntity);
    const delay = 500;

    phaserScene.time.addEvent({
      delay: CANNON_SHOT_DELAY,
      callback: function () {
        object.setTint(colors.greenHex);
        if (isMyShip(shipEntity)) playSound("success_notif", Category.UI);
      },
      callbackScope: phaserScene,
    });

    phaserScene.time.addEvent({
      delay: delay + CANNON_SHOT_DELAY,
      callback: function () {
        object.clearTint();
      },
      callbackScope: phaserScene,
    });
    phaserScene.time.addEvent({
      delay: delay * 2 + CANNON_SHOT_DELAY,
      callback: function () {
        object.setTint(colors.greenHex);
      },
      callbackScope: phaserScene,
    });

    phaserScene.time.addEvent({
      delay: delay * 3 + CANNON_SHOT_DELAY,
      callback: function () {
        object.clearTint();
      },
      callbackScope: phaserScene,
    });
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
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const rangeColor = { tint, alpha: 0.5 };
      renderFiringArea(layer, group, position, rotation, length, cannonEntity, rangeColor);
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
