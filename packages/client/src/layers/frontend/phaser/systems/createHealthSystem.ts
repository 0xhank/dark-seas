import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineEnterSystem,
  defineUpdateSystem,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
} from "@latticexyz/recs";
import { Animations, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createHealthSystem(layer: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool },
    },
    parentLayers: {
      network: {
        components: { Health, OnFire, Leak, DamagedMast, SailPosition, CrewCount, Position },
      },
    },
    components: { UpdateQueue },
    positions,
  } = layer;

  defineUpdateSystem(world, [Has(Health)], (update) => {
    if (!update.value[0] || !update.value[1]) return;
    if (Number(update.value[0].value) >= Number(update.value[1].value)) return;
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();
    const position = getComponentValueStrict(Position, update.entity);
    updateQueue.push("Lost health!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });

    const spriteId = `${update.entity}-explosion`;

    const object = objectPool.get(spriteId, "Sprite");
    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: "explosion-entity",
      once: async (sprite) => {
        sprite.play(Animations.Explosion);
        sprite.setOrigin(0.5, 0.92);
        sprite.setPosition(x, y);
        sprite.setDepth(RenderDepth.UI5);
        sprite.on(`animationcomplete-${Animations.Explosion}`, () => {
          objectPool.remove(spriteId);
        });
      },
    });
  });

  defineUpdateSystem(world, [Has(CrewCount)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("Lost crew!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
  });

  defineEnterSystem(world, [Has(OnFire)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("On fire!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
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
