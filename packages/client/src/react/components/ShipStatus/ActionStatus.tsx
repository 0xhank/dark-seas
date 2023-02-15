import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, getComponentValueStrict, Has, runQuery } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { ActionNames, ActionType, Phase } from "../../../types";
import { colors } from "../../styles/global";
import { ActionComponent } from "./Action";

function CommitStatus({ shipEntity, txExecuting }: { shipEntity: EntityIndex; txExecuting: boolean }) {
  const {
    components: { SelectedMove, MoveCard, CommittedMove, LastMove },
  } = useMUD();

  const committedMove = useComponentValue(CommittedMove, shipEntity)?.value;
  const selectedMove = useComponentValue(SelectedMove, shipEntity)?.value;
  const acted = !!committedMove && committedMove == selectedMove;

  let action1 = <ActionComponent name="Select a move" status={0} />;

  if (selectedMove) {
    const status = acted ? 3 : txExecuting ? 2 : 1;
    const direction = getComponentValueStrict(MoveCard, selectedMove as EntityIndex).direction;
    const movementName = direction == 0 ? "Straight" : direction > 180 ? "Left" : "Right";
    action1 = <ActionComponent name={"Move " + movementName} status={status} />;
  }

  return (
    <>
      <Title>Move</Title>
      {action1}
      <ActionComponent name="" status={-1} />
    </>
  );
}

function RevealStatus({
  shipEntity,
  turn,
  txExecuting,
}: {
  shipEntity: EntityIndex;
  turn: number;
  txExecuting: boolean;
}) {
  const {
    components: { LastMove, CommittedMove, MoveCard },
  } = useMUD();

  const playerEntity = usePlayer();
  const acted = useComponentValue(LastMove, playerEntity)?.value == turn;
  const committedMove = useComponentValue(CommittedMove, shipEntity)?.value;

  let action1 = <ActionComponent name="" status={-1} />;

  if (committedMove) {
    const status = acted ? 3 : txExecuting ? 2 : 1;
    const direction = getComponentValueStrict(MoveCard, committedMove as EntityIndex).direction;
    const movementName = direction == 0 ? "Straight" : direction > 180 ? "Left" : "Right";
    action1 = <ActionComponent name={"Reveal " + movementName} status={status} />;
  }

  return (
    <>
      <Title>Reveal</Title>
      {action1}
      <ActionComponent name="" status={-1} />{" "}
    </>
  );
}

function ActStatus({ shipEntity, turn, txExecuting }: { shipEntity: EntityIndex; turn: number; txExecuting: boolean }) {
  const {
    components: { LastAction, SelectedActions, MoveCard },
  } = useMUD();

  const playerEntity = usePlayer();
  const none = "Select an action";
  let action1 = <ActionComponent name={none} status={0} />;
  let action2 = <ActionComponent name={none} status={0} />;

  const acted = useComponentValue(LastAction, playerEntity)?.value == turn;
  const selectedActions = useComponentValue(SelectedActions, shipEntity);

  if (acted) {
    action1 = <ActionComponent name={""} status={-1} />;
    action2 = <ActionComponent name={""} status={-1} />;
  }
  if (selectedActions) {
    const status = acted ? 3 : txExecuting ? 2 : 1;
    const [actionType1, actionType2] = selectedActions.actionTypes;
    if (actionType1 !== ActionType.None) action1 = <ActionComponent name={ActionNames[actionType1]} status={status} />;
    if (actionType2 !== ActionType.None) action2 = <ActionComponent name={ActionNames[actionType2]} status={status} />;
  }

  return (
    <>
      <Title>Action</Title>
      {action1}
      {action2}
    </>
  );
}

export function ActionStatus({ shipEntity }: { shipEntity: EntityIndex }) {
  const {
    network: { clock },
    utils: { getPhase, getTurn },
    actions: { Action },
  } = useMUD();

  const time = useObservableValue(clock.time$) || 0;
  useObservableValue(Action.update$);
  const phase = getPhase(time);
  const turn = getTurn(time) || 0;
  let content = null;
  content = null;
  const txExecuting = [...runQuery([Has(Action)])].length > 0;

  if (phase == Phase.Action) {
    content = <ActStatus shipEntity={shipEntity} turn={turn} txExecuting={txExecuting} />;
  } else if (phase == Phase.Commit) {
    content = <CommitStatus shipEntity={shipEntity} txExecuting={txExecuting} />;
  } else {
    content = <RevealStatus shipEntity={shipEntity} turn={turn} txExecuting={txExecuting} />;
  }

  return <ActionStatusContainer>{content}</ActionStatusContainer>;
}

const ActionStatusContainer = styled.div`
  background: ${colors.lightTan};
  border-radius: 0px 0px 6px 6px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  height: 70px;
  gap: 4px;
  margin: 4px;
`;

const Title = styled.span`
  font-size: 0.8rem;
  line-height: 1rem;
  text-transform: uppercase;
`;
