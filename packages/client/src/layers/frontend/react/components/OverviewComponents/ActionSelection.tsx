import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, setComponent } from "@latticexyz/recs";
import { ActionImg, ActionNames, ActionType, Layers } from "../../../../../types";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: { SelectedActions, SelectedShip },
      utils: { checkActionPossible },
    },
  } = layers;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const selectedActions = getComponentValue(SelectedActions, ship)?.value || [-1, -1];

  const disabled = selectedActions.every((a) => a !== -1);

  return (
    <>
      {Object.keys(ActionType).map((a) => {
        const action = Number(a);
        if (isNaN(action)) return null;
        if (!checkActionPossible(action as ActionType, ship)) return null;
        const usedAlready = selectedActions.find((a) => a == action) != undefined;

        return (
          <OptionButton
            isSelected={usedAlready}
            disabled={disabled && !usedAlready}
            key={`selectedAction-${action}`}
            onClick={(e) => {
              e.stopPropagation();
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
              setComponent(SelectedShip, GodEntityIndex, { value: ship });
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
