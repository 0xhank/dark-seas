import { EntityIndex, getComponentValue, setComponent } from "@latticexyz/recs";
import { Action, ActionImg, ActionNames, Layers } from "../../../../../types";
import { OptionButton } from "../../styles/global";

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
                if (newArray[0] == -1) newArray[0] = action;
                else if (newArray[1] == -1) newArray[1] = action;
                else return;
              } else {
                newArray[index] = -1;
              }

              setComponent(SelectedActions, ship, { value: newArray });
            }}
          >
            <img
              src={ActionImg[action]}
              style={{
                height: "80%",
                objectFit: "scale-down",
                filter: usedAlready
                  ? "invert(100%)"
                  : "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)",
              }}
            />
            <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
          </OptionButton>
        );
      })}
    </>
  );
};
