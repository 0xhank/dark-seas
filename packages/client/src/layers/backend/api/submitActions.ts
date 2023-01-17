import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { Action, ActionType } from "../../../types";
import { NetworkLayer } from "../../network";
import { TxType } from "../types";

export function submitActions(
  network: NetworkLayer,
  actions: ActionSystem,
  getTargetedShips: (cannonEntity: EntityIndex) => EntityIndex[],
  shipActions: Action[]
) {
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
      if (shipActions.length == 0 || playerEntity == null) {
        actions.cancel(actionId);
        return null;
      }

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

      const shipStruct = shipActions.map((action) => {
        const metadata = action.actionTypes.map((actionType, i) => {
          if (actionType == ActionType.Load) return abi.encode(["uint256"], [action.specialEntities[i]]);
          if (actionType == ActionType.Fire) {
            const cannonEntity = world.entityToIndex.get(action.specialEntities[i]);
            if (!cannonEntity) return "";
            const targetedShips = getTargetedShips(cannonEntity);
            return abi.encode(
              ["uint256", "uint256[]"],
              [action.specialEntities[i], targetedShips.map((ship) => world.entities[ship])]
            );
          } else return abi.encode(["uint256"], [0]);
        });

        return {
          shipEntity: action.shipEntity,
          actionTypes: action.actionTypes,
          metadata: [metadata[0], metadata[1]] as [string, string],
        };
      });

      console.log("ships:", shipStruct);
      return shipStruct;
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
