import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { NetworkLayer } from "../../network";

export function submitActions(
  network: NetworkLayer,
  actions: ActionSystem,
  ships: EntityIndex[],
  shipActions: number[][]
) {
  const {
    components: { OwnedBy },
    network: { connectedAddress },
    utils: { getPlayerEntity },
    world,
  } = network;

  const prefix = "Submit Actions: ";
  const actionId = `submitActions ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    components: { OwnedBy },
    requirement: ({ OwnedBy }) => {
      if (ships.length !== shipActions.length) {
        console.warn(prefix, "ship and movecard mismatch");
        return null;
      }
      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (playerEntity == null) return null;

      for (let i = 0; i < ships.length; i++) {
        const shipEntity = ships[i];
        const shipActionList = shipActions[i];
        if (shipActionList.every((elem) => elem == -1)) continue;
        const shipOwner = getComponentValue(OwnedBy, shipEntity)?.value;
        if (shipOwner == null) {
          console.warn(prefix, "Entity has no owner");
          return null;
        }

        if (shipOwner !== connectedAddress.get()) {
          console.warn(prefix, "Can only move entities you own", shipOwner, connectedAddress.get());
          return null;
        }

        if (shipActionList.every((elem) => elem == -1)) {
          console.warn(prefix, "Action is empty");
          return null;
        }
      }

      const shipWorldEntities = ships.map((s) => world.entities[s]);

      return { ships: shipWorldEntities, shipActions };
    },
    updates: () => [],
    execute: ({ ships, shipActions }) => {
      network.api.submitActions(ships, shipActions);
    },
  });
}
