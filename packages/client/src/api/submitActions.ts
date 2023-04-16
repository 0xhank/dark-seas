import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { utils } from "ethers";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { ActionStruct } from "../../../contracts/types/ethers-contracts/ActionSystem";
import { components } from "../components";
import { Action, ActionHashes, ActionType, TxType } from "../game/types";
import { world } from "../world";

export function submitActions(
  gameIndex: EntityIndex,
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  getTargetedShips: (cannonEntity: EntityIndex) => EntityIndex[],
  shipActions: Action[],
  override?: boolean
) {
  const { OwnedBy } = components;

  const actionId = `submitActions ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: { OwnedBy },
    requirement: ({ OwnedBy }) => {
      const gameId = world.entities[gameIndex];
      if (!override) {
        if (shipActions.length == 0) {
          actions.cancel(actionId);
          return null;
        }
      }

      const shipStruct: ActionStruct[] = [];
      shipActions.forEach((action) => {
        if (action.actionTypes.every((elem) => elem == ActionType.None)) return null;
        const shipOwner = getComponentValue(OwnedBy, world.getEntityIndexStrict(action.shipEntity))?.value;
        if (shipOwner == null) {
          return;
        }

        const metadata = action.actionTypes.map((actionType, i) => {
          const specialEntity = action.specialEntities[i];
          if (actionType == ActionType.Load || actionType == ActionType.ClaimCrate)
            return abi.encode(["uint256"], [specialEntity]);
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
          actions: [
            utils.toUtf8Bytes(ActionHashes[action.actionTypes[0]]),
            utils.toUtf8Bytes(ActionHashes[action.actionTypes[1]]),
          ],
          metadata: [metadata[0], metadata[1]] as [string, string],
        });
      });

      if (shipStruct.length == 0 && !override) {
        console.log("no actions submitted");
        actions.cancel(actionId);
        return null;
      }
      return { shipStruct, gameId };
    },
    updates: () => [],
    execute: ({ shipStruct, gameId }) => {
      console.log("submitting actions:", actions);
      return systems["ds.system.Action"].executeTyped(gameId, shipStruct, {
        gasLimit: 10_000_000,
      });
    },
    metadata: {
      type: TxType.Action,
      metadata: shipActions,
    },
  });
}
