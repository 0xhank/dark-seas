import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import { usePlayer } from "../../PlayerContext";
import { ConfirmButton, Success } from "../styles/global";

export function RevealButtons() {
  const {
    components: { LastMove, EncodedCommitment },
    utils: { getTurn },
    api: { revealMove },
    godEntity,
  } = useMUD();

  const currentTurn = getTurn();
  const playerEntity = usePlayer();
  const acted = useComponentValue(LastMove, playerEntity, { value: 0 }).value == currentTurn;
  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;

  const handleSubmitExecute = () => {
    const encoding = useComponentValue(EncodedCommitment, godEntity)?.value;
    if (encoding) revealMove(encoding);
  };

  if (acted) return <Success>Move reveal successful!</Success>;
  if (!encodedCommitment) return <Success>No moves to reveal</Success>;
  return (
    <ConfirmButton style={{ width: "100%", fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitExecute}>
      Reveal Moves
    </ConfirmButton>
  );
}
