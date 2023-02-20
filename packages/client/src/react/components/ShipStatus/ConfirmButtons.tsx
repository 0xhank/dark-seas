import { useObservableValue } from "@latticexyz/react";
import { Has, runQuery } from "@latticexyz/recs";
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

  useObservableValue(Action.update$);

  const time = useObservableValue(clock.time$) || 0;

  const phase: Phase | undefined = getPhase(time);
  const turn = getTurn(time) || 0;
  const tooEarly = getPhase(time, false) !== phase;

  const txExecuting = [...runQuery([Has(Action)])].length > 0;

  let content = null;

  if (phase == Phase.Reveal) content = <RevealButtons tooEarly={tooEarly} turn={turn} txExecuting={txExecuting} />;
  else if (phase == Phase.Commit) content = <CommitButtons tooEarly={tooEarly} txExecuting={txExecuting} />;
  else if (phase == Phase.Action) content = <ActionButtons tooEarly={tooEarly} turn={turn} txExecuting={txExecuting} />;

  return <div style={{ minHeight: "50px" }}>{content}</div>;
}
