import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../../contracts/types/SystemTypes";

export function spawnPlayer(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  name: string,
  ships: EntityID[],
  override?: boolean
) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      return name;
    },
    updates: () => [],
    execute: (name: string) => {
      return systems["ds.system.PlayerSpawn"].executeTyped(name, ships, {
        gasLimit: 30_000_000,
      });
    },
  });
}
