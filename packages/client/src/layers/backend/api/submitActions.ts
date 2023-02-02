import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { ActionStruct } from "../../../../../contracts/types/ethers-contracts/ActionSystem";
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

      const shipStruct: ActionStruct[] = [];
      shipActions.forEach((action) => {
        if (action.actionTypes.every((elem) => elem == ActionType.None)) return null;
        const shipOwner = getComponentValue(OwnedBy, world.getEntityIndexStrict(action.shipEntity))?.value;
        if (shipOwner == null) {
          return;
        }

        if (shipOwner !== connectedAddress.get()) {
          return;
        }

        const metadata = action.actionTypes.map((actionType, i) => {
          const specialEntity = action.specialEntities[i];
          if (actionType == ActionType.Load) return abi.encode(["uint256"], [specialEntity]);
          if (actionType == ActionType.Fire) {
            const cannonEntity = world.entityToIndex.get(specialEntity);
            if (!cannonEntity) return "";
            const targetedShips = getTargetedShips(cannonEntity);
            return abi.encode(
              ["uint256", "uint256[]"],
              [action.specialEntities[i], targetedShips.map((ship) => world.entities[ship])]
            );
          } else return abi.encode(["uint256"], [0]);
        });

        shipStruct.push({
          shipEntity: action.shipEntity,
          actionTypes: action.actionTypes,
          metadata: [metadata[0], metadata[1]] as [string, string],
        });
      });

      if (shipStruct.length == 0) {
        console.log("no actions submitted");
        actions.cancel(actionId);
        return null;
      }
      return shipStruct;
    },
    updates: () => [],
    execute: (actions) => {
      network.api.submitActions(actions);
    },
    metadata: {
      type: TxType.Action,
      metadata: shipActions,
    },
  });
}
