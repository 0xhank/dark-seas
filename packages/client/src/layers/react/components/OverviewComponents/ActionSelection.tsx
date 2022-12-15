import { EntityIndex, getComponentValue, setComponent } from "@latticexyz/recs";
import { Action, ActionImg, ActionNames, Layers } from "../../../../types";
import { Button } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    utils: { checkActionPossible },
  } = layers.network;

  const {
    components: { SelectedActions },
  } = layers.phaser;

  const selectedActions = getComponentValue(SelectedActions, ship)?.value || [-1, -1, -1];

  return (
    <>
      {Object.keys(Action).map((a) => {
        const action = Number(a);
        if (isNaN(action)) return null;
        if (!checkActionPossible(action as Action, ship)) return null;
        const usedAlready = selectedActions.find((a) => a == action) != undefined;

        return (
          <Button
            disabled={usedAlready}
            key={`selectedAction-${action}`}
            onClick={() => {
              const newArray = selectedActions;
              setComponent(SelectedActions, ship, { value: newArray });
            }}
          >
            <img
              src={ActionImg[action]}
              style={{
                height: "80%",
                objectFit: "scale-down",
                filter: "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)",
              }}
            />
            <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
          </Button>
        );
      })}
    </>
  );
};
