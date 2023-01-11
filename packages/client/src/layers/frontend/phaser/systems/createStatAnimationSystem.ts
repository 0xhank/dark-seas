import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  getComponentValueStrict,
  Has,
} from "@latticexyz/recs";
import { getSternLocation, midpoint } from "../../../../utils/trig";
import { Animations, CANNON_SHOT_LENGTH, MOVE_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createStatAnimationSystem(layer: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool },
    },
    parentLayers: {
      network: {
        components: { Health, OnFire, SailPosition, Position, Rotation, Length },
      },
    },
    positions,
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

          setTimeout(() => sprite.setAlpha(1), delay * i + CANNON_SHOT_LENGTH);
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

  // SAIL POSITION UPDATE
  defineUpdateSystem(world, [Has(SailPosition)], (update) => {
    const sailPosition = getComponentValueStrict(SailPosition, update.entity).value;
    if (sailPosition != 0) return;
  });
}
