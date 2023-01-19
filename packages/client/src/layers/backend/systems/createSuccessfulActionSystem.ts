import { defineRxSystem, EntityIndex, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { BigNumber } from "ethers";
import { BytesLike, defaultAbiCoder as abi } from "ethers/lib/utils";
import { ActionStruct } from "../../../../../contracts/types/ethers-contracts/ActionSystem";
import { ActionType } from "../../../types";
import { BackendLayer } from "../types";

export function createSuccessfulActionSystem(layer: BackendLayer) {
  const {
    parentLayers: {
      network: {
        components: { Health },
        systemCallStreams,
        utils: { bigNumToEntityID },
      },
    },
    world,
    components: {
      ExecutedExtinguishFire,
      ExecutedShots,
      ExecutedChangeSail,
      ExecutedLoad,
      ExecutedRepairCannons,
      ExecutedRepairSail,
      LocalHealth,
    },
  } = layer;

  function parseLoadAction(action: BytesLike) {
    const [cannonEntity] = abi.decode(["uint256"], action);
    return world.entityToIndex.get(bigNumToEntityID(cannonEntity));
  }

  function parseShotAction(action: BytesLike): { cannonEntity: EntityIndex | undefined; targets: EntityIndex[] } {
    const [cannonID, targetIDs] = abi.decode(["uint256", "uint256[]"], action);
    const cannonEntity = world.entityToIndex.get(bigNumToEntityID(cannonID));
    const targets = targetIDs.reduce((targetArr: EntityIndex[], curr: BigNumber) => {
      const entityIndex = world.entityToIndex.get(bigNumToEntityID(curr));
      if (!entityIndex) return targetArr;
      return [...targetArr, entityIndex];
    }, []);

    return { cannonEntity, targets };
  }

  defineRxSystem(world, systemCallStreams["ds.system.Action"], (systemCall) => {
    const { args, systemId, updates } = systemCall;
    const { actions: rawActions } = args as {
      actions: ActionStruct[];
    };

    rawActions.forEach((action) => {
      const shipEntity = world.entityToIndex.get(bigNumToEntityID(action.shipEntity));
      if (!shipEntity) return;

      action.actionTypes.forEach((actionType, i) => {
        if (actionType == ActionType.Load) {
          const parsedCannon = parseLoadAction(action.metadata[i]);
          if (!parsedCannon) return;
          setComponent(ExecutedLoad, parsedCannon, { value: true });
        } else if (actionType == ActionType.Fire) {
          const { cannonEntity, targets } = parseShotAction(action.metadata[i]);
          if (!cannonEntity) return;

          const damage = targets.map((target) => {
            const newHealth = updates.find((update) => update.entity == target && update.component == Health)?.value
              ?.value as number | undefined;
            const oldHealth = getComponentValueStrict(LocalHealth, target).value;

            console.log("old health:", oldHealth, "new health:", newHealth);
            return oldHealth - (newHealth || oldHealth);
          });
          console.log("targets:", targets, "damage:", damage);
          setComponent(ExecutedShots, cannonEntity, { targets, damage });
        } else if (actionType == ActionType.ExtinguishFire) {
          setComponent(ExecutedExtinguishFire, shipEntity, { value: true });
        } else if (actionType == ActionType.LowerSail || actionType == ActionType.RaiseSail) {
          setComponent(ExecutedChangeSail, shipEntity, { value: true });
        } else if (actionType == ActionType.RepairCannons) {
          setComponent(ExecutedRepairCannons, shipEntity, { value: true });
        } else if (actionType == ActionType.RepairSail) {
          setComponent(ExecutedRepairSail, shipEntity, { value: true });
        }
      });
    });
  });
}
