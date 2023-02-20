import { useObservableValue } from "@latticexyz/react";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { ActionState, ActionStateString } from "@latticexyz/std-client";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Container } from "../../styles/global";
import { Cell } from "../Cell";

const gridConfig = {
  gridRowStart: 4,
  gridRowEnd: 8,
  gridColumnStart: 1,
  gridColumnEnd: 3,
};

export function ActionQueue() {
  const {
    actions: { Action },
  } = useMUD();
  useObservableValue(Action.update$);
  return (
    <Cell style={gridConfig}>
      <Container>
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
    </Cell>
  );
}
