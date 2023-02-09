import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";

export function spawnPlayer(systems: TxQueue<SystemTypes>, actions: ActionSystem, name: string, override?: boolean) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    components: {},
    requirement: () => {
      override;
    },
    updates: () => [],
    execute: () => {
      console.log("spawning");
      const location: Coord = { x: 0, y: 0 };
      systems["ds.system.PlayerSpawn"].executeTyped(name, location);
    },
  });
}
