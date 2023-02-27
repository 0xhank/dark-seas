import { useComponentValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { Category } from "../../../sound";
import { ActionType } from "../../../types";
import { Button, Success } from "../../styles/global";

export function ActionButtons({
  tooEarly,
  turn,
  txExecuting,
}: {
  tooEarly: boolean;
  turn: number;
  txExecuting: boolean;
}) {
  const {
    components: { SelectedActions, LastAction },
    utils: { getPlayerShipsWithActions, playSound, clearComponent },
    api: { submitActions },
  } = useMUD();

  const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
    getComponentValueStrict(SelectedActions, entity)
  );
  const playerEntity = usePlayer();
  const acted = useComponentValue(LastAction, playerEntity)?.value == turn;
  const cannotAct =
    !acted &&
    (selectedActions.length == 0 ||
      selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
  const handleSubmitActions = () => {
    const shipsAndActions = getPlayerShipsWithActions();
    if (!shipsAndActions) return;
    playSound("click", Category.UI);

    submitActions(shipsAndActions);
  };

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
