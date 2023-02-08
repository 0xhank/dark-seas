import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { NetworkLayer } from "../../network";

export function respawn(network: NetworkLayer, actions: ActionSystem, shipEntities: EntityIndex[]) {
  const {
    world,
    components: { OwnedBy },
    api: { respawn },
  } = network;
  const actionId = `respawn ${Math.random()}` as EntityID;

  actions.add({
    id: actionId,
    components: { OwnedBy },
    requirement: ({ OwnedBy }) => {
      shipEntities.every((shipEntity) => {
        const owner = getComponentValue(OwnedBy, shipEntity)?.value;
        if (!owner) return false;
        return true;
      });

      const shipIds = shipEntities.map((shipEntity) => world.entities[shipEntity]);
      return shipIds;
    },
    updates: () => [],
    execute: (shipIds: EntityID[]) => respawn(shipIds),
  });
}
