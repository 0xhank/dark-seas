import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
} from "@latticexyz/recs";
import { getSternLocation, midpoint } from "../../../../utils/trig";
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
        components: { Health, OnFire, DamagedMast, SailPosition, Position, Rotation, Length },
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
      const { x, y } = tileCoordToPixelCoord(hitLocations[i], positions.posWidth, positions.posHeight);

      object.setComponent({
        id: `explosion-${i}`,
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
