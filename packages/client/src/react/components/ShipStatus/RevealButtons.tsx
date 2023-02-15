import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { ConfirmButton, Success } from "../../styles/global";

export function RevealButtons({
  tooEarly,
  turn,
  txExecuting,
}: {
  tooEarly: boolean;
  turn: number;
  txExecuting: boolean;
}) {
  const {
    components: { EncodedCommitment, LastMove },
    api: { revealMove },
    godEntity,
  } = useMUD();

  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;

  const handleSubmitExecute = () => {
    const encoding = useComponentValue(EncodedCommitment, godEntity)?.value;
    if (encoding) revealMove(encoding);
  };
  const playerEntity = usePlayer();
  const acted = useComponentValue(LastMove, playerEntity)?.value == turn;

  const showExecuting = txExecuting && !acted;

  if (showExecuting) {
    return <ConfirmButton disabled>Executing...</ConfirmButton>;
  }

  if (acted) return <Success>Move reveal successful!</Success>;
  if (!encodedCommitment) return <Success>No moves to reveal</Success>;

  const disabled = tooEarly;
  return (
    <ConfirmButton
      disabled={disabled}
      style={{ width: "100%", fontSize: "1rem", lineHeight: "1.25rem" }}
      onClick={handleSubmitExecute}
    >
      Reveal Moves
    </ConfirmButton>
  );
}
