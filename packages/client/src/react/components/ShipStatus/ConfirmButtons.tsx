import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValue, getComponentValueStrict, Has, runQuery } from "@latticexyz/recs";
import { merge } from "rxjs";
import styled from "styled-components";
import { useMUD } from "../../../MUDContext";
import { usePlayer } from "../../../PlayerContext";
import { ActionType, Phase } from "../../../types";
import { colors, Success } from "../../styles/global";
import { ActionButtons } from "./ActionButtons";
import { CommitButtons } from "./CommitButtons";
import { RevealButtons } from "./RevealButtons";

export function ConfirmButtons() {
  const {
    components: {},
    network: { clock },
    utils: { getPhase, getTurn },
    godEntity,
    actions: { Action },
    components: { SelectedMove, SelectedActions, EncodedCommitment, HealthLocal, LastAction, LastMove },
  } = useMUD();

  useObservableValue(
    merge(
      HealthLocal.update$,
      SelectedMove.update$,
      SelectedActions.update$,
      LastAction.update$,
      LastMove.update$,
      Action.update$
    )
  );

  const playerEntity = usePlayer();

  const time = useObservableValue(clock.time$) || 0;

  const phase: Phase | undefined = getPhase(time);

  const tooEarly = getPhase(time, false) !== phase;

  const txExecuting = [...runQuery([Has(Action)])].length > 0;

  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;
  const currentTurn = getTurn(time);

  let cannotAct = false;
  let acted = false;
  if (phase == Phase.Commit) {
    const selectedMoves = [...getComponentEntities(SelectedMove)];
    acted = encodedCommitment !== undefined;
    cannotAct = selectedMoves.length == 0;
  } else if (phase == Phase.Reveal) {
    acted = getComponentValue(LastMove, playerEntity)?.value == currentTurn;
  } else if (phase == Phase.Action) {
    const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
      getComponentValueStrict(SelectedActions, entity)
    );
    acted = getComponentValue(LastAction, playerEntity)?.value == currentTurn;
    cannotAct =
      !acted &&
      (selectedActions.length == 0 ||
        selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
  }

  const showExecuting = txExecuting && !acted;

  let content = null;
  if (showExecuting) content = <Success>Executing...</Success>;
  else if (phase == Phase.Reveal) content = <RevealButtons acted={acted} />;
  else if (phase == Phase.Commit) content = <CommitButtons acted={acted} />;
  else if (phase == Phase.Action) content = <ActionButtons acted={acted} />;

  const disabled = tooEarly || cannotAct;

  return <ConfirmButtonsContainer hide={disabled}>{disabled ? null : content}</ConfirmButtonsContainer>;
}

const ConfirmButtonsContainer = styled.div<{ hide: boolean }>`
  position: absolute;
  margin: 0 auto;
  top: 6px;
  z-index: -1;
  display: flex;
  gap: 6px;
  background: ${colors.darkBrown};

  min-height: 70px;
  border-radius: 10px 10px 0 0;
  transform: ${({ hide }) => (hide ? "translateY(0)" : "translateY(-70px)")};
  transition: all 0.2s ease-out;
  width: 500px;

  padding: 6px;
`;
