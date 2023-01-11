import { defineComponentSystem, getComponentEntities, removeComponent, setComponent } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { Action } from "../../../types";
import { BackendLayer, TxType } from "../types";
export function createSuccessfulActionSystem(layer: BackendLayer) {
  const {
    world,
    components: { ExecutedActions, SelectedActions, Targeted },
    actions: { Action },
    systemDecoders: { onAction },
  } = layer;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction) return;

    const state = newAction.state as ActionState;
    if (!newAction.metadata) return;
    const { type, metadata } = newAction.metadata as { type: TxType; metadata: Action[] };
    if (type != TxType.Action || state != ActionState.Complete) return;

    [...getComponentEntities(Targeted)].forEach((ship) => removeComponent(Targeted, ship));
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
