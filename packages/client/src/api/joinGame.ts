import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { world } from "../world";

export function joinGame(
  gameIndex: EntityIndex,
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  ships: EntityIndex[],
  override?: boolean
) {
  const actionId = `join-game-${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      const shipIds = ships.map((ship) => world.entities[ship]);
      const gameId = world.entities[gameIndex];
      return { gameId, shipIds };
    },
    updates: () => [],
    execute: ({ shipIds, gameId }) => {
      return systems["ds.system.JoinGame"].executeTyped(gameId, shipIds, {
        gasLimit: 30_000_000,
      });
    },
  });
}
