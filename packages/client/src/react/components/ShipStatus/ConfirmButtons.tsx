import { useObservableValue } from "@latticexyz/react";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Phase } from "../../../types";
import { ActionButtons } from "./ActionButtons";
import { CommitButtons } from "./CommitButtons";
import { RevealButtons } from "./RevealButtons";

export function ConfirmButtons() {
  const {
    network: { clock },
    utils: { getPhase, getTurn },
    actions: { Action },
  } = useMUD();

  const time = useObservableValue(clock.time$) || 0;

  const phase: Phase | undefined = getPhase(time);
  const turn = getTurn(time) || 0;
  const tooEarly = getPhase(time, false) !== phase;

  let content = null;

  if (phase == Phase.Reveal) content = <RevealButtons tooEarly={tooEarly} turn={turn} />;
  else if (phase == Phase.Commit) content = <CommitButtons tooEarly={tooEarly} />;
  else if (phase == Phase.Action) content = <ActionButtons tooEarly={tooEarly} turn={turn} />;

  return <div style={{ minHeight: "50px", width: "100%" }}>{content}</div>;
}
