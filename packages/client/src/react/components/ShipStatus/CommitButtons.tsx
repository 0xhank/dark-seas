import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValue, Has, HasValue, runQuery } from "@latticexyz/recs";
import { merge } from "rxjs";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { world } from "../../../mud/world";
import { Category } from "../../../sound";
import { Button, Success } from "../../styles/global";

export function CommitButtons({ tooEarly, txExecuting }: { tooEarly: boolean; txExecuting: boolean }) {
  const {
    components: { SelectedMove, EncodedCommitment, Ship, OwnedBy, CommittedMove },
    utils: { getPlayerShipsWithMoves, playSound },
    api: { commitMove },
    godEntity,
  } = useMUD();

  useObservableValue(merge(SelectedMove.update$, CommittedMove.update$));
  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;
  const selectedMoves = [...getComponentEntities(SelectedMove)];
  const acted = encodedCommitment !== undefined;
  const cannotAct = selectedMoves.length == 0;

  const playerEntity = usePlayer();
  const aliveShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];
  const movesComplete = aliveShips.every((ship) => {
    const committedMove = getComponentValue(CommittedMove, ship)?.value;
    const selectedMove = getComponentValue(SelectedMove, ship)?.value;
    return committedMove == selectedMove;
  });

  const handleSubmitCommitment = () => {
    const shipsAndMoves = getPlayerShipsWithMoves();
    if (!shipsAndMoves) return;

    playSound("click", Category.UI);

    commitMove(shipsAndMoves);
  };

  const showExecuting = txExecuting && !acted;

  if (showExecuting) {
    return <Button disabled>Executing...</Button>;
  }

  const disabled = tooEarly || cannotAct;
  if (acted && movesComplete) {
    return <Success>Moves Successful</Success>;
  }
  return (
    <Button onClick={handleSubmitCommitment} disabled={disabled}>
      {!disabled && "Confirm All Moves"}
    </Button>
  );
}
