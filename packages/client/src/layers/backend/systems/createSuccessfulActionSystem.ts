import {
  ComponentValue,
  defineRxSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  setComponent,
} from "@latticexyz/recs";
import { BigNumber } from "ethers";
import { BytesLike, defaultAbiCoder as abi } from "ethers/lib/utils";
import { ActionStruct } from "../../../../../contracts/types/ethers-contracts/ActionSystem";
import { ActionType } from "../../../types";
import { BackendLayer } from "../types";

export function createSuccessfulActionSystem(layer: BackendLayer) {
  const {
    world,
    components: {
      ExecutedShots,
      ExecutedCannon,
      ExecutedActions,
      HealthLocal,
      OnFireLocal,
      SailPositionLocal,
      DamagedCannonsLocal,
      SelectedShip,
      HealthBackend,
      SelectedActions,
      HoveredAction,
    },
    utils: { isMyShip, clearComponent, bigNumToEntityID },
    systemCallStreams,
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
      if (isMyShip(shipEntity)) {
        clearComponent(SelectedShip);
        clearComponent(SelectedActions);
        clearComponent(HoveredAction);
      }

      const executedActions = action.actionTypes.map((a, i) => {
        const actionType = a as ActionType;
        completeAction(shipEntity, actionType, action.metadata[i], shipUpdates);
        return actionType;
      });
      setComponent(ExecutedActions, shipEntity, { value: executedActions });
      //TODO: animate this

      const shipNewHealth = shipUpdates.get(`${shipEntity}-Health`)?.value as number | undefined;
      if (shipNewHealth) {
        setComponent(HealthLocal, shipEntity, { value: shipNewHealth });
        setComponent(HealthBackend, shipEntity, { value: shipNewHealth });
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
      const cannonEntity = parseLoadAction(metadata);
      if (!cannonEntity) return;
      setComponent(ExecutedCannon, cannonEntity, { value: true });
    } else if (actionType == ActionType.Fire) {
      const { cannonEntity, targets } = parseShotAction(metadata);
      if (!cannonEntity) return;
      setComponent(ExecutedShots, cannonEntity, encodeExecutedShot(targets, shipUpdates));
      setComponent(ExecutedCannon, cannonEntity, { value: true });
    } else if (actionType == ActionType.ExtinguishFire) {
      const newOnFire = shipUpdates.get(`${shipEntity}-OnFire`)?.value as number | undefined;
      setComponent(OnFireLocal, shipEntity, { value: newOnFire || 0 });
    } else if (actionType == ActionType.LowerSail) {
      const oldSailPosition = getComponentValue(SailPositionLocal, shipEntity)?.value || 2;
      setComponent(SailPositionLocal, shipEntity, { value: oldSailPosition - 1 });
    } else if (actionType == ActionType.RaiseSail) {
      const oldSailPosition = getComponentValue(SailPositionLocal, shipEntity)?.value || 1;
      setComponent(SailPositionLocal, shipEntity, { value: oldSailPosition + 1 });
    } else if (actionType == ActionType.RepairCannons) {
      const newCannons = shipUpdates.get(`${shipEntity}-DamagedCannons`)?.value as number | undefined;
      setComponent(DamagedCannonsLocal, shipEntity, { value: newCannons || 0 });
    } else if (actionType == ActionType.RepairSail) {
      setComponent(SailPositionLocal, shipEntity, { value: 1 });
    }
  }

  function encodeExecutedShot(targets: EntityIndex[], shipUpdates: Map<string, ComponentValue>) {
    const damage: number[] = [];
    const specialDamage: number[] = [];

    targets.forEach((target) => {
      const healthKey = `${target}-Health`;
      const oldHealth = getComponentValueStrict(HealthBackend, target).value;
      const newHealth = shipUpdates.get(healthKey)?.value as number | undefined;

      const damageDealt = Math.min(3, oldHealth - (newHealth == undefined ? oldHealth : newHealth));
      setComponent(HealthBackend, target, { value: oldHealth - damageDealt });
      damage.push(damageDealt);

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
