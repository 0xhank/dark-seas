import { useComponentValue, useEntityQuery, useObservableValue } from "@latticexyz/react";
import { Has, HasValue, getComponentEntities, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { merge } from "rxjs";
import { useGame } from "../../../../mud/providers/GameProvider";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { Button, Success } from "../../../../styles/global";
import { world } from "../../../../world";
import { Category } from "../../..//sound";

export function CommitButtons({ tooEarly }: { tooEarly: boolean }) {
  const {
    components: { SelectedMove, EncodedCommitment, Ship, OwnedBy, CommittedMove },
    utils: { getPlayerShipsWithMoves, playSound },
    actions: { Action },
    api: { commitMove },
    gameEntity,
  } = useGame();

  useObservableValue(merge(SelectedMove.update$, CommittedMove.update$));
  const encodedCommitment = useComponentValue(EncodedCommitment, gameEntity)?.value;
  const selectedMoves = [...getComponentEntities(SelectedMove)];
  const acted = encodedCommitment !== undefined;
  const cannotAct = selectedMoves.length == 0;

  const ownerEntity = useOwner();
  const aliveShips = [...useEntityQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[ownerEntity] })])];
  const movesComplete = aliveShips.every((ship) => {
    const committedMove = getComponentValue(CommittedMove, ship)?.value;
    const selectedMove = getComponentValue(SelectedMove, ship)?.value;
    return committedMove == selectedMove;
  });

  const txExecuting = !![...useEntityQuery([Has(Action)])].find((entity) => {
    const action = getComponentValueStrict(Action, entity);
    return action.state !== ActionState.TxReduced && Action.world.entities[entity].includes("commit");
  });
  const handleSubmitCommitment = () => {
    const shipsAndMoves = getPlayerShipsWithMoves();
    if (!shipsAndMoves) return;

    playSound("click", Category.UI);

    commitMove(gameEntity, shipsAndMoves);
  };

  const showExecuting = txExecuting && !acted;

  if (showExecuting) {
    return (
      <Button disabled style={{ width: "100%", height: "100%" }}>
        Executing...
      </Button>
    );
  }

  const disabled = tooEarly || cannotAct;
  if (acted && movesComplete) {
    return <Success style={{ width: "100%", height: "100%" }}>Moves Successful</Success>;
  }
  return (
    <Button onClick={handleSubmitCommitment} disabled={disabled} style={{ width: "100%", height: "100%" }}>
      {!disabled && "Confirm All Moves"}
    </Button>
  );
}
