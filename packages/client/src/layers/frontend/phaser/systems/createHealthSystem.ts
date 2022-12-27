import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getPositionByVector, getSternLocation, midpoint } from "../../../../utils/trig";
import { Animations, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createHealthSystem(layer: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool, config },
    },
    parentLayers: {
      network: {
        components: { Health, OnFire, Leak, DamagedMast, SailPosition, CrewCount, Position, Rotation, Length },
      },
    },
    components: { UpdateQueue },
    positions,
  } = layer;

  defineUpdateSystem(world, [Has(Health)], (update) => {
    if (update.component != Health) return;
    if (!update.value[0] || !update.value[1]) return;
    const healthLost = Number(update.value[1].value) - Number(update.value[0].value);
    if (healthLost <= 0 || healthLost >= 4) return;
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const length = getComponentValueStrict(Length, update.entity).value;
    const sternPosition = getSternLocation(position, rotation, length);
    const delay = 600;
    const center = midpoint(position, sternPosition);
    const hitLocations = [midpoint(position, center), center, midpoint(center, sternPosition)];
    for (let i = 0; i < healthLost; i++) {
      const spriteId = `${update.entity}-explosion-${i}`;

      const object = objectPool.get(spriteId, "Sprite");
      console.log("hit location:", hitLocations[i]);
      const { x, y } = tileCoordToPixelCoord(hitLocations[i], positions.posWidth, positions.posHeight);

      object.setComponent({
        id: `explosion-${i}`,
        // now: async () => {
        //   console.log("i:", i);
        //   await new Promise((r) => setTimeout(() => {}, delay * i));
        // },
        once: async (sprite) => {
          // sprite.setScale(Math.random() + 1);
          sprite.setOrigin(0.5, 0.5);
          sprite.setPosition(x, y);
          sprite.setDepth(RenderDepth.UI5);
          sprite.play(Animations.Explosion);
          sprite.setAlpha(0);

          setTimeout(() => sprite.setAlpha(1), delay * i);
          setTimeout(() => objectPool.remove(spriteId), 2000 + delay * i);
        },
      });
    }
  });

  defineUpdateSystem(world, [Has(CrewCount)], (update) => {
    if (!update.value[0] || !update.value[1]) return;
    const crewLost = Number(update.value[1].value) - Number(update.value[0].value);

    if (crewLost <= 0 || crewLost >= 4) return;
    const position = getComponentValueStrict(Position, update.entity);
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const delay = 100;
    const duration = 2000;
    const distance = 8;
    for (let i = 0; i < crewLost; i++) {
      const spriteId = `${update.entity}-death-${i}`;
      const sprite = config.sprites[Sprites.DeadMan];

      const object = objectPool.get(spriteId, "Sprite");
      const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

      object.setComponent({
        id: `death-${i}`,
        once: async (gameObject) => {
          gameObject.setAlpha(0);
          setTimeout(() => gameObject.setAlpha(1), delay * i);

          gameObject.setTexture(sprite.assetKey, sprite.frame);
          gameObject.setOrigin(0.5, 0.5);
          gameObject.setPosition(x, y);
          gameObject.setDepth(RenderDepth.UI5);
          gameObject.setAngle(Math.random() * 360);
          gameObject.setScale(2);
          const direction = Math.random() * 360;
          await tween({
            delay: delay * i,
            targets: gameObject,
            duration,
            props: getPositionByVector({ x, y }, rotation, distance * positions.posWidth, direction),
            ease: Phaser.Math.Easing.Cubic.Out,
          });

          await tween({
            targets: gameObject,
            duration,
            props: {
              alpha: {
                value: 0,
              },
            },
            ease: Phaser.Math.Easing.Linear,
          });
        },
      });
    }
  });

  defineEnterSystem(world, [Has(OnFire)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();
    const position = getComponentValueStrict(Position, update.entity);
    updateQueue.push("On fire!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
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

  defineExitSystem(world, [Has(OnFire)], (update) => {
    for (let i = 0; i < 4; i++) {
      const spriteId = `${update.entity}-fire-${i}`;
      objectPool.remove(spriteId);
    }
  });

  defineEnterSystem(world, [Has(Leak)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("Sprung a leak!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
  });

  defineEnterSystem(world, [Has(DamagedMast)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("Mast is damaged!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
  });

  defineUpdateSystem(world, [Has(SailPosition)], (update) => {
    const sailPosition = getComponentValueStrict(SailPosition, update.entity).value;
    if (sailPosition != 0) return;
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("Sails broke!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
  });
}
