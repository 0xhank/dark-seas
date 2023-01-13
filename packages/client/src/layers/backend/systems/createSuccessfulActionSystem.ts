import { defineComponentSystem, setComponent } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { Move } from "../../../types";
import { BackendLayer, TxType } from "../types";
export function createSuccessfulActionSystem(layer: BackendLayer) {
  const {
    world,
    components: { SelectedActions, ExecutedActions, EncodedCommitment, CommittedMove, Targeted },
    actions: { Action },
    utils: { clearComponent },
    systemDecoders: { onAction },
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

    if (type != TxType.Action || state != ActionState.Complete) return;

    clearComponent(Targeted);
    clearComponent(SelectedActions);
  });

  onAction(({ actions }) => {
    actions.forEach((action) => {
      const shipEntity = world.entityToIndex.get(action.shipEntity);
      if (!shipEntity) return;
      setComponent(ExecutedActions, shipEntity, {
        actionTypes: action.actionTypes,
        specialEntities: action.specialEntities,
      });
    });
  });
}
