import { EntityID, hasComponent } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { NetworkLayer } from "../../network";

export function spawnPlayer(
  network: NetworkLayer,
  actions: ActionSystem,
  name: string,
  burnerPrivateKey: string | undefined
) {
  const {
    components: { Player },
    utils: { activeNetwork },
    world,
  } = network;

  const prefix = "Spawn Player: ";
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    components: { Player },
    requirement: ({ Player }) => {
      const address = activeNetwork().connectedAddress.get();
      if (!address) {
        console.warn(prefix, "No address connected");
        actions.cancel(actionId);
        return;
      }

      const playerEntity = world.entityToIndex.get(address as EntityID);

      if (playerEntity != null && hasComponent(Player, playerEntity)) {
        console.warn(prefix, "Player already spawned, canceling spawn.");
        actions.cancel(actionId);
        return null;
      }

      return true;
    },
    updates: () => [],
    execute: () => {
      console.log("spawning");
      return network.api.spawnPlayer(name, burnerPrivateKey);
    },
  });
}
