import { defineComponentSystem, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Move, TxType } from "../../types";

export function createSuccessfulMoveSystem() {
  const {
    world,
    components: { EncodedCommitment, CommittedMove },
    actions: { Action },
    godEntity,
  } = useMUD();

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction?.metadata) return;

    const { type, metadata } = newAction.metadata as { type: TxType; metadata: any };
    if (type !== TxType.Commit) return;

    const { moves, encoding } = metadata as { moves: Move[]; encoding: string };
    setComponent(EncodedCommitment, godEntity, { value: encoding });

    moves.map((move) => {
      const shipEntity = world.entityToIndex.get(move.shipEntity);
      const moveCardEntity = world.entityToIndex.get(move.moveCardEntity);
      if (!shipEntity || !moveCardEntity) return;
      setComponent(CommittedMove, shipEntity, { value: moveCardEntity });
    });
  });
}
