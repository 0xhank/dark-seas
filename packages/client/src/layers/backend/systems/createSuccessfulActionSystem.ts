import {
  defineComponentSystem,
  defineRxSystem,
  EntityIndex,
  getComponentValueStrict,
  setComponent,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { BigNumber } from "ethers";
import { BytesLike, defaultAbiCoder as abi } from "ethers/lib/utils";
import { merge } from "rxjs";
import { ActionStruct } from "../../../../../contracts/types/ethers-contracts/ActionSystem";
import { ActionType, Move } from "../../../types";
import { BackendLayer, TxType } from "../types";

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
      EncodedCommitment,
      CommittedMove,
      ExecutedChangeSail,
      ExecutedLoad,
      ExecutedRepairCannons,
      ExecutedRepairSail,
      LocalHealth,
    },
    actions: { Action },
    utils: { clearComponent, isMyShip, playSound },
    godIndex,
  } = layer;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction) return;

    const state = newAction.state as ActionState;
    if (!newAction.metadata) return;
    const { type, metadata } = newAction.metadata as { type: TxType; metadata: any };
    if (type == TxType.Commit) {
      const { moves, encoding } = metadata as { moves: Move[]; encoding: string };
      setComponent(EncodedCommitment, godIndex, { value: encoding });

      moves.map((move) => {
        const shipEntity = world.entityToIndex.get(move.shipEntity);
        const moveCardEntity = world.entityToIndex.get(move.moveCardEntity);
        if (!shipEntity || !moveCardEntity) return;
        setComponent(CommittedMove, shipEntity, { value: moveCardEntity });
      });
    }
  });

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

  defineRxSystem(world, merge(systemCallStreams["ds.system.Action"]), (systemCall) => {
    const { args, systemId, updates } = systemCall;
    const { actions: rawActions } = args as {
      actions: ActionStruct[];
    };

    const healthUpdates = updates.filter((update) => update.component == Health);
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
            const newHealth = healthUpdates.find((update) => update.entity == target)?.value?.value as
              | number
              | undefined;
            const oldHealth = getComponentValueStrict(LocalHealth, target).value;
            return oldHealth - (newHealth || oldHealth);
          });
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
