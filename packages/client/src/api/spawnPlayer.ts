import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";

export function spawnPlayer(systems: TxQueue<SystemTypes>, actions: ActionSystem, name: string, override?: boolean) {
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
      console.log("spawning");
      const position: Coord = { x: 0, y: 0 };
      return systems["ds.system.PlayerSpawn"].executeTyped(name, position, {
        gasLimit: 20_000_000,
      });
    },
  });
}
