import { useMUD } from "../../../mud/providers/MUDProvider";
import { Category } from "../../../sound";
import { ConfirmButton, Success } from "../../styles/global";

export function CommitButtons({ acted }: { acted: boolean }) {
  const {
    components: { SelectedMove },
    utils: { getPlayerShipsWithMoves, playSound, clearComponent },
    api: { commitMove },
  } = useMUD();

  const handleSubmitCommitment = () => {
    const shipsAndMoves = getPlayerShipsWithMoves();
    if (!shipsAndMoves) return;

    playSound("click", Category.UI);

    commitMove(shipsAndMoves);
  };

  const removeMoves = () => clearComponent(SelectedMove);

  if (acted) {
    return <Success>Moves Successful!</Success>;
  }
  return (
    <>
      <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitCommitment}>
        Confirm Moves
      </ConfirmButton>
      <ConfirmButton noGoldBorder onClick={removeMoves} style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}>
        Clear
      </ConfirmButton>
    </>
  );
}
