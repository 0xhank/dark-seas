import { EntityID, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { Action, ActionType } from "../../../types";
import { NetworkLayer } from "../../network";
import { TxType } from "../types";

export function submitActions(network: NetworkLayer, actions: ActionSystem, shipActions: Action[]) {
  const {
    components: { OwnedBy },
    network: { connectedAddress },
    utils: { getPlayerEntity },
    world,
  } = network;

  const prefix = "Submit Actions: ";
  const actionId = `submitActions ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    components: { OwnedBy },
    requirement: ({ OwnedBy }) => {
      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (shipActions.length == 0) return null;
      if (playerEntity == null) return null;

      for (const action of shipActions) {
        if (action.actionTypes.every((elem) => elem == ActionType.None)) return null;
        const shipOwner = getComponentValue(OwnedBy, world.getEntityIndexStrict(action.shipEntity))?.value;
        if (shipOwner == null) {
          console.warn(prefix, "Entity has no owner");
          actions.cancel(actionId);
          return null;
        }

        if (shipOwner !== connectedAddress.get()) {
          console.warn(prefix, "Can only move entities you own", shipOwner, connectedAddress.get());
          actions.cancel(actionId);
          return null;
        }
      }

      return shipActions;
    },
    updates: () => [],
    execute: (shipActions) => {
      network.api.submitActions(shipActions);
    },
    metadata: {
      type: TxType.Action,
      metadata: shipActions,
    },
  });
}
