import { defineComponentSystem, defineRxSystem, setComponent } from "@latticexyz/recs";
import { MoveStruct } from "../../../../../contracts/types/ethers-contracts/MoveSystem";
import { Move } from "../../../types";
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
    components: { EncodedCommitment, CommittedMove, ExecutedChangeSail },
    actions: { Action },
    utils: { clearComponent, isMyShip, playSound },
    godIndex,
  } = layer;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction?.metadata) return;

    const { type, metadata } = newAction.metadata as { type: TxType; metadata: any };
    if (type !== TxType.Commit) return;

    const { moves, encoding } = metadata as { moves: Move[]; encoding: string };
    setComponent(EncodedCommitment, godIndex, { value: encoding });

    moves.map((move) => {
      const shipEntity = world.entityToIndex.get(move.shipEntity);
      const moveCardEntity = world.entityToIndex.get(move.moveCardEntity);
      if (!shipEntity || !moveCardEntity) return;
      setComponent(CommittedMove, shipEntity, { value: moveCardEntity });
    });
  });

  defineRxSystem(world, systemCallStreams["ds.system.Move"], (systemCall) => {
    const { args, systemId, updates } = systemCall;
    const { actions: rawMoves } = args as {
      actions: MoveStruct[];
    };
  });
}
