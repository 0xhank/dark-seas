import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineUpdateSystem,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { getSternLocation, midpoint } from "../../../../utils/trig";
import { colors } from "../../react/styles/global";
import { Animations, MOVE_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";
import { renderFiringArea } from "./renderShip";

export function createStatAnimationSystem(layer: PhaserLayer) {
  const {
    world,

    parentLayers: {
      network: {
        components: { Position, Rotation, Length, Cannon, OwnedBy },
      },
      backend: {
        components: { HealthLocal, OnFireLocal, DamagedCannonsLocal },
      },
    },
    scenes: {
      Main: { phaserScene, positions },
    },
    utils: { getSpriteObject, destroySpriteObject, getGroupObject },
  } = layer;

  // ON FIRE UPDATES
  defineUpdateSystem(world, [Has(OnFireLocal)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const { x, y } = tileCoordToPixelCoord(fireLocations[i], positions.posWidth, positions.posHeight);
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
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = getSpriteObject(spriteId);

      const coord = tileCoordToPixelCoord(fireLocations[i], positions.posWidth, positions.posHeight);

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

  defineComponentSystem(world, OnFireLocal, (update) => {
    if (!update.value[0]) return;
    if (!(update.value[0].value == 0)) return;
    for (let i = 0; i < 4; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      destroySpriteObject(spriteId);
    }
  });

  defineUpdateSystem(world, [Has(HealthLocal)], (update) => {
    if (update.value[0]?.value !== 0) return;

    for (let i = 0; i < 4; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      destroySpriteObject(spriteId);
    }
  });

  // BROKEN CANNON UPDATES

  defineComponentSystem(world, DamagedCannonsLocal, (update) => {
    const shipEntity = update.entity;

    // exit or enter
    if (update.value[0] == undefined || update.value[1] == undefined) return;

    const improvement = update.value[0].value - update.value[1].value < 0;
    if (improvement && update.value[0].value !== 0) return;
    const groupId = `flash-cannons-${shipEntity}`;
    const group = getGroupObject(groupId, true);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    const duration = 500;
    const repeat = -1;
    cannonEntities.forEach((cannonEntity) => {
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const rangeColor = { tint: improvement ? colors.greenHex : colors.blackHex, alpha: 0.3 };
      renderFiringArea(layer, group, position, rotation, length, cannonEntity, rangeColor);
    });

    phaserScene.tweens.add({
      targets: group.getChildren(),
      props: {
        alpha: 0.3,
      },
      ease: Phaser.Math.Easing.Sine.Out,
      duration: duration,
      repeat: repeat,
      yoyo: true,
    });

    phaserScene.time.addEvent({
      delay: duration * 3,
      callback: function () {
        group.clear(true, true);
      },
      callbackScope: phaserScene,
    });
  });
}
