import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { getSternLocation, midpoint } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { colors } from "../../react/styles/global";
import { Animations, CANNON_SHOT_LENGTH, MOVE_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";
import { renderFiringArea } from "./renderShip";

export function createStatAnimationSystem(layer: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool },
    },
    parentLayers: {
      network: {
        components: { Health, OnFire, DamagedCannons, Position, Rotation, Length, Cannon, OwnedBy },
      },
      backend: {
        utils: { playSound },
      },
    },
    positions,
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
  } = layer;

  // HEALTH UPDATES
  defineComponentSystem(world, Health, (update) => {
    if (update.component != Health) return;
    if (!update.value[0] || !update.value[1]) return;
    const healthLost = Number(update.value[1].value) - Number(update.value[0].value);
    if (healthLost <= 0 || healthLost >= 4) return;

    for (let i = 0; i < healthLost; i++) {
      const spriteId = `${update.entity}-explosion-${i}`;

      const object = objectPool.get(spriteId, "Sprite");

      object.setComponent({
        id: `explosion-${i}`,
        now: async (sprite) => {
          await tween({
            targets: sprite,
            duration: CANNON_SHOT_LENGTH,
          });
        },
        once: async (sprite) => {
          // sprite.setScale(Math.random() + 1);

          const position = getComponentValueStrict(Position, update.entity);
          const rotation = getComponentValueStrict(Rotation, update.entity).value;
          const length = getComponentValueStrict(Length, update.entity).value;
          const sternPosition = getSternLocation(position, rotation, length);
          const delay = 600;
          const center = midpoint(position, sternPosition);
          const hitLocations = [midpoint(position, center), center, midpoint(center, sternPosition)];
          const { x, y } = tileCoordToPixelCoord(hitLocations[i], positions.posWidth, positions.posHeight);

          sprite.setOrigin(0.5, 0.5);
          sprite.setPosition(x, y);
          sprite.setDepth(RenderDepth.UI5);
          sprite.play(Animations.Explosion);
          sprite.setAlpha(0);

          setTimeout(() => {
            sprite.setAlpha(1);
            playSound("impact_ship_1", Category.Combat);
          }, delay * i + CANNON_SHOT_LENGTH);
          setTimeout(() => objectPool.remove(spriteId), 2000 + delay * i + CANNON_SHOT_LENGTH);
        },
      });
    }
  });

  // ON FIRE UPDATES
  defineEnterSystem(world, [Has(OnFire)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = objectPool.get(spriteId, "Sprite");

      const { x, y } = tileCoordToPixelCoord(fireLocations[i], positions.posWidth, positions.posHeight);

      object.setComponent({
        id: `fire-entity-${i}`,
        once: async (sprite) => {
          sprite.setAlpha(0);
          setTimeout(() => {
            sprite.setAlpha(1);
            sprite.play(Animations.Fire);
          }, Math.random() * 1000);

          const xLoc = Math.random();
          const yLoc = Math.random();
          sprite.setOrigin(xLoc, yLoc);
          sprite.setScale(2);
          sprite.setPosition(x, y);
          sprite.setDepth(RenderDepth.UI4);
        },
      });
    }
  });

  defineUpdateSystem(world, [Has(OnFire), Has(Position), Has(Rotation)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const center = midpoint(position, sternPosition);
    const fireLocations = [midpoint(position, center), center, center, midpoint(center, sternPosition)];
    for (let i = 0; i < fireLocations.length; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      const object = objectPool.get(spriteId, "Sprite");

      const { x, y } = tileCoordToPixelCoord(fireLocations[i], positions.posWidth, positions.posHeight);

      object.setComponent({
        id: `fire-entity-${i}`,
        now: async (sprite) => {
          await tween({
            targets: sprite,
            duration: MOVE_LENGTH,
            props: { x, y },
            ease: Phaser.Math.Easing.Sine.InOut,
          });
        },
        once: async (sprite) => {
          sprite.setPosition(x, y);
        },
      });
    }
  });

  defineExitSystem(world, [Has(OnFire)], (update) => {
    for (let i = 0; i < 4; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      objectPool.remove(spriteId);
    }
  });

  defineUpdateSystem(world, [Has(Health)], (update) => {
    if (update.value[0]?.value !== 0) return;

    for (let i = 0; i < 4; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      objectPool.remove(spriteId);
    }
  });

  // BROKEN CANNON UPDATES

  defineComponentSystem(world, DamagedCannons, (update) => {
    const shipEntity = update.entity;

    // exit
    if (!update.value[0]) return;
    // update
    if (update.value[0] && update.value[1]) return;
    console.log(`flashing ${shipEntity} cannons`);
    const groupId = `flash-cannons-${shipEntity}`;
    const group = polygonRegistry.get(groupId) || phaserScene.add.group();
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];
    console.log("hello from", cannonEntities);

    const duration = 500;
    const repeat = -1;
    cannonEntities.forEach((cannonEntity) => {
      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const rangeColor = { tint: colors.blackHex, alpha: 0.3 };
      renderFiringArea(layer, group, position, rotation, length, cannonEntity, rangeColor);
    });

    phaserScene.tweens.add({
      targets: group.getChildren(),
      props: {
        alpha: 0,
      },
      ease: Phaser.Math.Easing.Sine.Out,
      duration: duration,
      repeat: repeat,
      yoyo: true,
    });

    phaserScene.time.addEvent({
      delay: duration * 7,
      callback: function () {
        console.log("clearing group");
        group.clear(true, true);
      },
      callbackScope: phaserScene,
    });
  });
}
