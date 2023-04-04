import { useObservableValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { ActionState, ActionStateString } from "@latticexyz/std-client";
import { useGame } from "../../../../mud/providers/GameProvider";
import { useHome } from "../../../../mud/providers/HomeProvider";
import { Container } from "../../../../styles/global";

const gridConfig = {
  gridRowStart: 10,
  gridRowEnd: 13,
  gridColumnStart: 3,
  gridColumnEnd: 13,
};
export function ActionQueue({ home }: { home?: boolean }) {
  const hook = home ? useHome : useGame;
  const {
    actions: { Action },
  } = hook();
  useObservableValue(Action.update$);
  return (
    <Container
      style={{
        width: "100px",
        height: "100px",
        color: "white",
        position: "fixed",
        bottom: 0,
        right: 0,
        pointerEvents: "none",
      }}
    >
      <p>Actions:</p>
      {[...getComponentEntities(Action)].map((e) => {
        const actionData = getComponentValueStrict(Action, e);
        const state = ActionStateString[actionData.state as ActionState];
        return (
          <p key={`action${e}`}>
            {Action.world.entities[e]}: {state}
          </p>
        );
      })}
    </Container>
  );
}
