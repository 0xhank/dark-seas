import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";

export function spawn(systems: TxQueue<SystemTypes>, actions: ActionSystem, name: string, override?: boolean) {
  const actionId = `spawn-${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      console.log("here");
      return name;
    },
    updates: () => [],
    execute: (name) => {
      console.log("spawning", name);
      return systems["ds.system.SpawnPlayer"].executeTyped(name);
    },
  });
}
