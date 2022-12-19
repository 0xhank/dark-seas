import {
  defineEnterSystem,
  defineUpdateSystem,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
} from "@latticexyz/recs";
import { PhaserLayer } from "../types";

export function createHealthSystem(layer: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool },
    },
    parentLayers: {
      network: {
        components: { Health, OnFire, Leak, DamagedMast, SailPosition, CrewCount },
      },
    },
    components: { UpdateQueue },
  } = layer;

  defineUpdateSystem(world, [Has(Health)], (update) => {
    const updateQueue = getComponentValue(UpdateQueue, update.entity)?.value || new Array<string>();

    updateQueue.push("Lost health!");
    setComponent(UpdateQueue, update.entity, { value: updateQueue });
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
