import { defineComponentSystem, defineSystem, EntityID, Has, Not } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { ActionType } from "../../../types";
import { Category } from "../sound/library";
import { BackendLayer, TxType } from "../types";

export function createUISoundSystem(backend: BackendLayer) {
  const {
    utils: { playSound },
    parentLayers: {
      network: {
        components: { Position, Rotation },
      },
    },
    world,
    components: { HoveredAction, HoveredMove, SelectedMove, SelectedActions, HoveredShip, SelectedShip },
    actions: { Action },
  } = backend;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction) return;
    const state = newAction.state as ActionState;
    if (!newAction.metadata) return;
    const { type } = newAction.metadata as { type: TxType; metadata: any };

    if (state == ActionState.Complete && type != TxType.Reveal) playSound("success_notif", Category.UI);
    if (state == ActionState.Failed) playSound("fail_notif", Category.UI);
  });

  defineComponentSystem(world, Rotation, (update) => {
    if (!update.value[0] || !update.value[1]) return;

    if (update.value[0]?.value !== update.value[1]?.value) {
      playSound("rudder_1", Category.Move);
    }
  });

  defineComponentSystem(world, Position, (update) => {
    if (!update.value[0] || !update.value[1]) return;

    playSound("whoosh", Category.Move);
  });

  defineSystem(world, [Has(HoveredAction)], (update) => {
    if (!update.value[0]) return;
    playSound("hover", Category.UI);
  });

  defineSystem(world, [Has(HoveredMove)], (update) => {
    if (!update.value[0]) return;
    playSound("hover", Category.UI);
  });

  defineSystem(world, [Has(SelectedMove)], (update) => {
    if (!update.value[0]) return;

    playSound("click", Category.UI);
  });

  defineComponentSystem(world, SelectedActions, (update) => {
    const addedAction = getAddedAction(update.value[1], update.value[0]);

    if (!addedAction || addedAction.actionType == ActionType.None) return;

    if (addedAction.actionType == ActionType.Load) {
      playSound("load_action", Category.Combat);
    }

    if (addedAction.actionType == ActionType.Fire) {
      playSound("fire_action", Category.Combat);
    }

    if (addedAction.actionType == ActionType.LowerSail || addedAction.actionType == ActionType.RaiseSail) {
      playSound("hoist_sail", Category.Action);
    } else {
      playSound("ship_repair_1", Category.Action);
    }
  });

  function getAddedAction(
    oldActions: { specialEntities: EntityID[]; actionTypes: ActionType[] } | undefined,
    newActions: { specialEntities: EntityID[]; actionTypes: ActionType[] } | undefined
  ): { specialEntity: EntityID; actionType: ActionType } | undefined {
    if (!newActions) return;

    const oldEntities = oldActions?.actionTypes
      .map((actionType, i) => ({
        specialEntity: oldActions?.specialEntities[i],
        actionType,
      }))
      .filter((action) => action.actionType !== ActionType.None);

    const newEntities = newActions?.actionTypes
      .map((actionType, i) => ({
        specialEntity: newActions?.specialEntities[i],
        actionType,
      }))
      .filter((action) => action.actionType !== ActionType.None);

    if (oldEntities && oldEntities.length > newEntities.length) return;

    const newAddition = newEntities?.find((candidate) => {
      if (candidate.actionType == ActionType.Fire || candidate.actionType == ActionType.Load) {
        return !oldEntities?.find((entity) => entity.specialEntity == candidate.specialEntity);
      } else {
        return !oldEntities?.find((entity) => entity.actionType == candidate.actionType);
      }
    });
    return newAddition;
  }

  defineSystem(world, [Has(HoveredShip)], (update) => {
    if (!update.value[0]) return;

    playSound("button_hover", Category.UI);
  });

  defineSystem(world, [Has(SelectedShip), Not(HoveredAction), Not(HoveredMove)], (update) => {
    if (!update.value[0]) return;

    if (update.value[0].value == update.value[1]?.value) return;
    playSound("click", Category.UI);
  });
}
