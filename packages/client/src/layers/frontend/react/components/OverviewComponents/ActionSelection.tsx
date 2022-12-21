import { EntityIndex, getComponentValue, setComponent } from "@latticexyz/recs";
import { Action, ActionImg, ActionNames, Layers } from "../../../../../types";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      components: { SelectedActions },
      utils: { checkActionPossible },
    },
  } = layers;

  const selectedActions = getComponentValue(SelectedActions, ship)?.value || [-1, -1];

  let disabled = false;
  if (selectedActions.every((a) => a !== -1)) {
    disabled = true;
  }

  return (
    <>
      {Object.keys(Action).map((a) => {
        const action = Number(a);
        if (isNaN(action)) return null;
        if (!checkActionPossible(action as Action, ship)) return null;
        const usedAlready = selectedActions.find((a) => a == action) != undefined;

        return (
          <OptionButton
            isSelected={usedAlready}
            disabled={disabled && !usedAlready}
            key={`selectedAction-${action}`}
            onClick={() => {
              const newArray = selectedActions;
              const index = newArray.indexOf(action);
              if (index == -1) {
                const unusedSlot = newArray.indexOf(-1);
                if (unusedSlot == -1) return;
                newArray[unusedSlot] = action;
              } else {
                newArray[index] = -1;
              }

              setComponent(SelectedActions, ship, { value: newArray });
            }}
          >
            <Img src={ActionImg[action]} />
            <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
          </OptionButton>
        );
      })}
    </>
  );
};
