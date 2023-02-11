import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, getComponentEntities, getComponentValue } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { usePlayer } from "../../PlayerContext";
import { Category } from "../../sound";
import { colors, ConfirmButton, Success } from "../styles/global";

export function ActionButtons({ yourShips }: { yourShips: EntityIndex[] }) {
  const {
    components: { SelectedActions, LastAction },
    utils: { getPlayerShipsWithActions, playSound, getTurn, clearComponent },
    api: { submitActions },
    network: { clock },
  } = useMUD();

  const time = useObservableValue(clock.time$) || 0;
  useObservableValue(SelectedActions.update$);
  const playerEntity = usePlayer();

  const currentTurn = getTurn(time);

  const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
    getComponentValue(SelectedActions, entity)
  );
  const acted = useComponentValue(LastAction, playerEntity, { value: 0 })?.value == currentTurn;
  const someShipUnselected = selectedActions.length != yourShips.length;

  const handleSubmitActions = () => {
    const shipsAndActions = getPlayerShipsWithActions();
    if (!shipsAndActions) return;
    playSound("click", Category.UI);

    submitActions(shipsAndActions);
  };

  const removeActions = () => clearComponent(SelectedActions);

  if (acted) {
    return <Success>Actions Successful</Success>;
  } else {
    return (
      <>
        <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitActions}>
          <p>Submit Actions</p>
          {someShipUnselected && (
            <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
              You haven't selected actions for one of your ships!
            </p>
          )}
        </ConfirmButton>
        <ConfirmButton
          noGoldBorder
          onClick={removeActions}
          style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
        >
          Clear
        </ConfirmButton>
      </>
    );
  }
}
