import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { components } from "../mud/components";
import { world } from "../mud/world";

export function respawn(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  shipEntities: EntityIndex[],
  override?: boolean
) {
  const { OwnedBy } = components;

  const actionId = `respawn ${Math.random()}` as EntityID;

  actions.add({
    id: actionId,
    components: { OwnedBy },
    requirement: ({ OwnedBy }) => {
      if (!override) {
        shipEntities.every((shipEntity) => {
          const owner = getComponentValue(OwnedBy, shipEntity)?.value;
          if (!owner) return false;
          return true;
        });
      }

      const shipIds = shipEntities.map((shipEntity) => world.entities[shipEntity]);
      console.log("ship ids:", shipIds);
      return shipIds;
    },
    updates: () => [],
    execute: (shipIds: EntityID[]) => {
      console.log("respawning");
      systems["ds.system.Respawn"].executeTyped(shipIds);
    },
  });
}
