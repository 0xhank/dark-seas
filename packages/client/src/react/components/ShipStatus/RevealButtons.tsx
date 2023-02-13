import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { ConfirmButton, Success } from "../../styles/global";

export function RevealButtons({ acted }: { acted: boolean }) {
  const {
    components: { EncodedCommitment },
    api: { revealMove },
    godEntity,
  } = useMUD();

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
