import { ComponentValue, defineRxSystem, EntityIndex, getComponentValueStrict, setComponent } from "@latticexyz/recs";
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

    const shipUpdates: Map<string, ComponentValue> = new Map();
    updates.forEach((update) => {
      const entity = update.entity;
      const component = update.component;
      const key = `${entity}-${component.id}`;
      if (update.value == undefined) return;
      shipUpdates.set(key, update.value);
    });

    // iterate through ships
    rawActions.forEach((action) => {
      const shipEntity = world.entityToIndex.get(bigNumToEntityID(action.shipEntity));
      if (!shipEntity) return;

      // iterate through ship actions
      action.actionTypes.forEach((actionType, i) => {
        completeAction(shipEntity, actionType as ActionType, action.metadata[i], shipUpdates);
      });

      //TODO: animate this
      if (shipUpdates.get(`${shipEntity}-Health`)) {
        const oldHealth = getComponentValueStrict(LocalHealth, shipEntity).value || 1;
        setComponent(LocalHealth, shipEntity, { value: oldHealth - 1 });
      }
    });
  });

  function completeAction(
    shipEntity: EntityIndex,
    actionType: number,
    metadata: BytesLike,
    shipUpdates: Map<string, ComponentValue>
  ) {
    if (actionType == ActionType.Load) {
      const parsedCannon = parseLoadAction(metadata);
      if (!parsedCannon) return;
      setComponent(ExecutedLoad, parsedCannon, { value: true });
    } else if (actionType == ActionType.Fire) {
      const { cannonEntity, targets } = parseShotAction(metadata);
      if (!cannonEntity) return;
      setComponent(ExecutedShots, cannonEntity, encodeExecutedShot(targets, shipUpdates));
    } else if (actionType == ActionType.ExtinguishFire) {
      setComponent(ExecutedExtinguishFire, shipEntity, { value: true });
    } else if (actionType == ActionType.LowerSail || actionType == ActionType.RaiseSail) {
      setComponent(ExecutedChangeSail, shipEntity, { value: true });
    } else if (actionType == ActionType.RepairCannons) {
      setComponent(ExecutedRepairCannons, shipEntity, { value: true });
    } else if (actionType == ActionType.RepairSail) {
      setComponent(ExecutedRepairSail, shipEntity, { value: true });
    }
  }

  function encodeExecutedShot(targets: EntityIndex[], shipUpdates: Map<string, ComponentValue>) {
    const damage: number[] = [];
    const specialDamage: number[] = [];
    targets.forEach((target) => {
      const healthKey = `${target}-Health`;
      const oldHealth = getComponentValueStrict(LocalHealth, target).value;
      const newHealth = shipUpdates.get(healthKey)?.value as number | undefined;
      shipUpdates.delete(healthKey);
      damage.push(oldHealth - (newHealth || oldHealth));

      const fireKey = `${target}-OnFire`;
      const damagedCannonsKey = `${target}-DamagedCannons`;
      const sailPositionKey = `${target}-SailPosition`;
      let total = 0;
      if (shipUpdates.get(fireKey)) {
        total++;
        shipUpdates.delete(fireKey);
      }
      if (shipUpdates.get(damagedCannonsKey)) {
        total += 10;
        shipUpdates.delete(damagedCannonsKey);
      }
      if (shipUpdates.get(sailPositionKey)) {
        total += 100;
        shipUpdates.delete(sailPositionKey);
      }
      specialDamage.push(total);
    });

    return { targets, damage, specialDamage };
  }
}
