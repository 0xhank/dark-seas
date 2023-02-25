import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { Button, Success } from "../../styles/global";

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
  const encoding = useComponentValue(EncodedCommitment, godEntity)?.value;

  const handleSubmitExecute = () => {
    if (encoding) revealMove(encoding);
  };
  const playerEntity = usePlayer();
  const acted = useComponentValue(LastMove, playerEntity)?.value == turn;

  const showExecuting = txExecuting && !acted;

  if (showExecuting) {
    return (
      <Button disabled style={{ width: "100%", height: "100%" }}>
        Executing...
      </Button>
    );
  }

  if (acted) return <Success style={{ width: "100%", height: "100%" }}>Move reveal successful!</Success>;
  if (!encodedCommitment)
    return (
      <Button disabled style={{ width: "100%", height: "100%" }}>
        No moves to reveal
      </Button>
    );

  const disabled = tooEarly;
  return (
    <Button
      disabled={disabled}
      style={{ width: "100%", height: "100%", fontSize: "1rem", lineHeight: "1.25rem" }}
      onClick={handleSubmitExecute}
    >
      {!disabled && "Reveal Moves"}
    </Button>
  );
}
