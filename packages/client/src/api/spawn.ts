import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";

export function spawn(systems: TxQueue<SystemTypes>, actions: ActionSystem, name: string, override?: boolean) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      return name;
    },
    updates: () => [],
    execute: (gameId: string) => {
      return systems["ds.system.SpawnPlayer"].executeTyped(name, {
        gasLimit: 30_000_000,
      });
    },
  });
}
