import { useComponentValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValueStrict, Has, runQuery } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { useGame } from "../../../../mud/providers/GameProvider";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { Button, Success } from "../../../../styles/global";
import { Category } from "../../..//sound";
import { ActionType } from "../../..//types";

export function ActionButtons({ tooEarly, turn }: { tooEarly: boolean; turn: number }) {
  const {
    components: { SelectedActions, LastAction },
    utils: { getPlayerShipsWithActions, playSound, getTargetedShips, getPlayerEntity },
    actions: { Action },
    api: { submitActions },
    gameEntity,
  } = useGame();

  const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
    getComponentValueStrict(SelectedActions, entity)
  );
  const ownerEntity = useOwner();
  const acted = useComponentValue(LastAction, getPlayerEntity(ownerEntity))?.value == turn;
  const cannotAct =
    !acted &&
    (selectedActions.length == 0 ||
      selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
  const handleSubmitActions = () => {
    const shipsAndActions = getPlayerShipsWithActions();
    if (!shipsAndActions) return;
    playSound("click", Category.UI);

    submitActions(gameEntity, shipsAndActions, getTargetedShips);
  };

  const txExecuting = !![...runQuery([Has(Action)])].find((entity) => {
    const action = getComponentValueStrict(Action, entity);
    return action.state !== ActionState.Complete && Action.world.entities[entity].includes("action");
  });
  const showExecuting = txExecuting && !acted;

  const disabled = tooEarly || cannotAct;
  if (showExecuting) {
    return (
      <Button disabled style={{ width: "100%", height: "100%" }}>
        Executing...
      </Button>
    );
  }
  if (acted) {
    return <Success style={{ width: "100%", height: "100%" }}>Actions Successful</Success>;
  } else {
    return (
      <>
        <Button
          disabled={disabled}
          style={{ width: "100%", height: "100%", fontSize: "1rem", lineHeight: "1.25rem" }}
          onClick={handleSubmitActions}
        >
          {!disabled && "Submit All Actions"}
        </Button>
      </>
    );
  }
}
