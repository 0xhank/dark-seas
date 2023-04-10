import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { world } from "../world";

export function extractShip(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  shipEntity: EntityIndex,
  override?: boolean
) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      const shipId = world.entities[shipEntity];
      if (!shipId) return null;
      return shipId;
    },
    updates: () => [],
    execute: (shipId: EntityID) => {
      return systems["ds.system.ExtractShip"].executeTyped(shipId, {
        gasLimit: 30_000_000,
      });
    },
  });
}

export function bulkExtract(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  shipEntities: EntityIndex[],
  override?: boolean
) {
  const actionId = `spawn ${Math.random()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      const shipIds = shipEntities.map((shipEntity) => world.entities[shipEntity]);
      if (shipIds.some((shipId) => shipId == undefined)) return null;
      return shipIds;
    },
    updates: () => [],
    execute: (shipIds: EntityID[]) => {
      return systems["ds.system.ExtractShip"].bulkExtract(shipIds, {
        gasLimit: 30_000_000,
      });
    },
  });
}
