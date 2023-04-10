import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { Has, getComponentValueStrict, runQuery } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { usePhaser } from "../../../../mud/providers/PhaserProvider";
import { Button, Success } from "../../../../styles/global";

export function RevealButtons({ tooEarly, turn }: { tooEarly: boolean; turn: number }) {
  const {
    components: { EncodedCommitment, LastMove },
    actions: { Action },
    api: { revealMove },
    utils: { getPlayerEntity },
    gameEntity,
  } = usePhaser();

  const encodedCommitment = useComponentValue(EncodedCommitment, gameEntity)?.value;
  const encoding = useComponentValue(EncodedCommitment, gameEntity)?.value;

  useObservableValue(Action.update$);

  const txExecuting = !![...runQuery([Has(Action)])].find((entity) => {
    const action = getComponentValueStrict(Action, entity);
    return action.state !== ActionState.Complete && Action.world.entities[entity].includes("reveal");
  });
  const handleSubmitExecute = () => {
    if (encoding) revealMove(encoding);
  };
  const ownerEntity = useOwner();
  const acted = useComponentValue(LastMove, getPlayerEntity(ownerEntity))?.value == turn;

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
