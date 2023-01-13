import { defineComponentSystem, defineSystem, Has, Not } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { ActionType } from "../../../types";
import { Category } from "../sound/library";
import { BackendLayer } from "../types";

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

    if (state == ActionState.Complete) playSound("success_notif", Category.UI);
    if (state == ActionState.Failed) playSound("fail_notif", Category.UI);
  });

  defineSystem(world, [Has(Position), Has(Rotation)], (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;

    playSound("rudder_1", Category.Move);
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
    const oldActions = update.value[1];
    const newActions = update.value[0];
    if (!newActions) return;
    if (!oldActions) return playSound("click", Category.UI);

    const newActionLength = newActions.actionTypes.filter((elem) => elem !== ActionType.None).length;
    const oldActionLength = oldActions.actionTypes.filter((elem) => elem !== ActionType.None).length;

    console.log(`newActionLength: ${newActionLength}, oldActionLength: ${oldActionLength}`);

    if (newActionLength > oldActionLength) playSound("click", Category.UI);
  });

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
