import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, getComponentEntities } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Category } from "../../sound";
import { colors, ConfirmButton, Success } from "../styles/global";

export function CommitButtons({ yourShips }: { yourShips: EntityIndex[] }) {
  const {
    components: { SelectedMove, EncodedCommitment, CommittedMove },
    utils: { getPlayerShipsWithMoves, playSound, clearComponent },
    api: { commitMove },
    godEntity,
  } = useMUD();

  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;
  const movesComplete = yourShips.every((shipEntity) => {
    const committedMove = useComponentValue(CommittedMove, shipEntity)?.value;
    const selectedMove = useComponentValue(SelectedMove, shipEntity)?.value;
    return committedMove == selectedMove;
  });

  const selectedMoves = [...getComponentEntities(SelectedMove)];
  const someShipUnselected = selectedMoves.length != yourShips.length;
  const acted = encodedCommitment !== undefined;

  const handleSubmitCommitment = () => {
    const shipsAndMoves = getPlayerShipsWithMoves();
    if (!shipsAndMoves) return;

    playSound("click", Category.UI);

    commitMove(shipsAndMoves);
  };

  const removeMoves = () => clearComponent(SelectedMove);

  if (movesComplete && encodedCommitment) {
    return <Success>Moves Successful!</Success>;
  }
  return (
    <>
      <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitCommitment}>
        Confirm Moves
        {someShipUnselected && (
          <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
            You haven't selected a move for one of your ships!
          </p>
        )}
      </ConfirmButton>
      <ConfirmButton noGoldBorder onClick={removeMoves} style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}>
        Clear
      </ConfirmButton>
    </>
  );
}
