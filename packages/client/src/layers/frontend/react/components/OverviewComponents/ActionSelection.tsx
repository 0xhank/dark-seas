import { EntityID, EntityIndex, getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { ActionImg, ActionNames, ActionType, Layers } from "../../../../../types";
import { DELAY } from "../../../constants";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: { SelectedActions, HoveredAction, ExecutedActions },
      utils: { checkActionPossible, handleNewActionsSpecial },
      godIndex,
    },
    network: {
      components: { LastAction },
      utils: { getPlayerEntity, getTurn },
    },
  } = layers;

  const playerEntity = getPlayerEntity();
  if (!playerEntity) return null;

  const selectedActions = getComponentValue(SelectedActions, ship) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const lastAction = getComponentValue(LastAction, playerEntity)?.value;
  const currentTurn = getTurn(DELAY);
  const actionsExecuted = currentTurn == lastAction;

  let actions: ActionType[] = [];

  if (!actionsExecuted) {
    actions = Object.keys(ActionType)
      .map((action) => Number(action))
      .filter((a) => checkActionPossible(a, ship));
  } else {
    actions = (getComponentValue(ExecutedActions, ship)?.value || []).filter(
      (a) => !isNaN(a) && ![ActionType.None].includes(a)
    );
  }

  const allActionsUsed = selectedActions.actionTypes.every((a) => a !== ActionType.None);
  const disabled = actionsExecuted || allActionsUsed;
  return (
    <>
      {actions.map((action) => {
        if (isNaN(action)) return null;
        const selected = !actionsExecuted && selectedActions.actionTypes.includes(action);
        return (
          <ActionButton
            selected={selected}
            disabled={disabled}
            executed={actionsExecuted}
            key={`actionOption-${action}`}
            actionType={action}
            handleClick={handleNewActionsSpecial}
            image={ActionImg[action]}
            subtitle={ActionNames[action]}
          />
        );
      })}
    </>
  );

  function ActionButton({
    selected = false,
    disabled = false,
    executed = false,
    actionType,
    imgRotation = 0,
    specialEntity = 0 as EntityIndex,
    handleClick,
    image,
    subtitle,
  }: {
    selected?: boolean;
    disabled?: boolean;
    executed?: boolean;
    actionType: ActionType;
    specialEntity?: EntityIndex;
    handleClick: (action: ActionType, specialEntity: EntityIndex) => void;
    image: string;
    imgRotation?: number;
    subtitle: string;
  }) {
    return (
      <OptionButton
        isSelected={selected}
        disabled={disabled && !selected}
        confirmed={executed}
        onMouseEnter={() => setComponent(HoveredAction, godIndex, { shipEntity: ship, actionType, specialEntity })}
        onMouseLeave={() => removeComponent(HoveredAction, godIndex)}
        onClick={(e) => {
          e.stopPropagation();
          handleClick(actionType, specialEntity || ship);
        }}
      >
        <Img src={image} style={{ height: "70%", transform: `rotate(${imgRotation}deg)` }} />
        <Sub>{subtitle}</Sub>
      </OptionButton>
    );
  }
};

const Sub = styled.p`
  line-height: 1rem;
  font-size: 0.8rem;
`;
