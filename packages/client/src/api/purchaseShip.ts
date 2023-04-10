import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { world } from "../world";

export function purchaseShip(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  shipEntity: EntityIndex,
  override?: boolean
) {
  const actionId = `create-game-${Date.now()}` as EntityID;
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
    execute: (shipId) => {
      return systems["ds.system.PurchaseShip"].executeTyped(shipId);
    },
  });
}
