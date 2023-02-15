import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Phase } from "../../../types";
import { colors } from "../../styles/global";
import { Action } from "./Action";

function CommitStatus({ shipEntity }: { shipEntity: EntityIndex }) {
  const {
    components: { SelectedMove, MoveCard, CommittedMove },
  } = useMUD();

  const committedMove = useComponentValue(CommittedMove, shipEntity)?.value;
  const selectedMove = useComponentValue(SelectedMove, shipEntity)?.value;
  const acted = !!committedMove && committedMove == selectedMove;

  let action1 = <Action name="Select a move" status={0} />;

  if (selectedMove) {
    const direction = getComponentValueStrict(MoveCard, selectedMove as EntityIndex).direction;
    const movementName = direction == 0 ? "Straight" : direction < 180 ? "Left" : "Right";
    action1 = <Action name={"Move " + movementName} status={acted ? 2 : 1} />;
  }

  return (
    <>
      <Title>Move</Title>
      {action1}
      <Action name="" status={-1} />
    </>
  );
}

function RevealStatus({ shipEntity }: { shipEntity: EntityIndex }) {
  let action1 = <Action name="Reveal move" status={0} />;
  let action2 = <Action name="" status={-1} />;

  return (
    <>
      <Title>Reveal</Title>
      {action1}
      {action2}
    </>
  );
}

function ActStatus({ shipEntity }: { shipEntity: EntityIndex }) {
  const none = "Select an action";
  let action1 = <Action name={none} status={0} />;
  let action2 = <Action name={none} status={0} />;

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
    utils: { getPhase },
  } = useMUD();

  const time = useObservableValue(clock.time$) || 0;
  const phase = getPhase(time);

  let content = null;
  if (phase == Phase.Action) {
    content = <ActStatus shipEntity={shipEntity} />;
  } else if (phase == Phase.Commit) {
    content = <CommitStatus shipEntity={shipEntity} />;
  } else {
    content = <RevealStatus shipEntity={shipEntity} />;
  }

  return <ActionStatusContainer>{content}</ActionStatusContainer>;
}

const ActionStatusContainer = styled.div`
  background: ${colors.lightTan};
  border-radius: 0px 0px 6px 6px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.span`
  font-size: 0.8rem;
  line-height: 1rem;
  text-transform: uppercase;
`;
