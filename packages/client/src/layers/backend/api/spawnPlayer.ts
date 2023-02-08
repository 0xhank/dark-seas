import { EntityID, hasComponent } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { Wallet } from "ethers";
import { NetworkLayer } from "../../network";

export function spawnPlayer(
  network: NetworkLayer,
  actions: ActionSystem,
  name: string,
  burnerPrivateKey: string | undefined
) {
  const {
    components: { Player },
    utils: { activeNetwork, createBurnerNetwork },
    ownerNetwork,
    world,
  } = network;

  const prefix = "Spawn Player: ";
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    components: { Player },
    requirement: async ({ Player }) => {
      const address = activeNetwork().connectedAddress.get();
      if (!address) {
        console.warn(prefix, "No address connected");
        actions.cancel(actionId);
        return null;
      }

      const playerEntity = world.entityToIndex.get(address as EntityID);

      if (playerEntity != null && hasComponent(Player, playerEntity)) {
        console.warn(prefix, "Player already spawned, canceling spawn.");
        actions.cancel(actionId);
        return null;
      }

      let connectedAddress;
      if (burnerPrivateKey) {
        const wallet = new Wallet(burnerPrivateKey);
        connectedAddress = wallet.address;
        await createBurnerNetwork(burnerPrivateKey);
      } else {
        connectedAddress = ownerNetwork.connectedAddress.get();
      }
      if (!connectedAddress) return null;

      return connectedAddress;
    },
    updates: () => [],
    execute: (addressPromise: Promise<string | null>) => {
      addressPromise.then((address) => {
        if (!address) {
          return;
        }
        console.log("spawning", address);
        return network.api.spawnPlayer(name, address);
      });
    },
  });
}
