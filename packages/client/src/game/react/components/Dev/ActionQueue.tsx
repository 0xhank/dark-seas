import { useObservableValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { ActionState, ActionStateString } from "@latticexyz/std-client";
import { useNetwork } from "../../../../mud/providers/NetworkProvider";
import { Container } from "../../../../styles/global";

export function ActionQueue() {
  const {
    actions: { Action },
  } = useNetwork();
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
