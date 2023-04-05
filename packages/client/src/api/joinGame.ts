import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";

export function joinGame(
  gameId: EntityID,
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  ships: EntityID[],
  override?: boolean
) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      return gameId;
    },
    updates: () => [],
    execute: (gameId: string) => {
      return systems["ds.system.JoinGame"].executeTyped(gameId, ships, {
        gasLimit: 30_000_000,
      });
    },
  });
}
