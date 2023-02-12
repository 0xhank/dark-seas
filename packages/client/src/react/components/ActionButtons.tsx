import { useMUD } from "../../MUDContext";
import { Category } from "../../sound";
import { ConfirmButton, Success } from "../styles/global";

export function ActionButtons({ acted }: { acted: boolean }) {
  const {
    components: { SelectedActions },
    utils: { getPlayerShipsWithActions, playSound, clearComponent },
    api: { submitActions },
  } = useMUD();

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
