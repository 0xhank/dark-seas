import { useComponentValue } from "@latticexyz/react";
import {
  EntityID,
  EntityIndex,
  getComponentValue,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import styled from "styled-components";
import { world } from "../../../../../mud/world";
import { useMUD } from "../../../../../MUDContext";
import { usePlayer } from "../../../../../PlayerContext";
import { ActionImg, ActionNames, ActionType } from "../../../../../types";
import { isBroadside } from "../../../../../utils/trig";
import { DELAY } from "../../../constants";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ shipEntity }: { shipEntity: EntityIndex }) => {
  const {
    components: {
      SelectedActions,
      HoveredAction,
      ExecutedActions,
      ExecutedCannon,
      DamagedCannonsLocal,
      OwnedBy,
      Cannon,
      Rotation,
      Loaded,
      LastAction,
    },
    utils: { checkActionPossible, handleNewActionsCannon, handleNewActionsSpecial, getPlayerEntity, getTurn },
    godEntity,
  } = useMUD();

  const playerEntity = usePlayer();

  const selectedActions = useComponentValue(SelectedActions, shipEntity) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const lastAction = useComponentValue(LastAction, playerEntity)?.value;
  const currentTurn = getTurn(DELAY);
  const actionsExecuted = currentTurn == lastAction;
  const executedActions = useComponentValue(ExecutedActions, shipEntity, { value: [] }).value;
  let cannonEntities: EntityIndex[] = [];
  let actions: ActionType[] = [];

  if (!actionsExecuted) {
    cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])].sort(
      (a, b) =>
        ((180 + (getComponentValue(Rotation, a)?.value || 0)) % 360) -
        ((180 + (getComponentValue(Rotation, a)?.value || 0)) % 360)
    );

    actions = Object.keys(ActionType)
      .map((action) => Number(action))
      .filter((a) => checkActionPossible(a, shipEntity));
  } else {
    cannonEntities = [
      ...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] }), Has(ExecutedCannon)]),
    ].sort(
      (a, b) =>
        ((180 + (getComponentValue(Rotation, a)?.value || 0)) % 360) -
        ((180 + (getComponentValue(Rotation, b)?.value || 0)) % 360)
    );
    actions = executedActions.filter(
      (a) => !isNaN(a) && ![ActionType.None, ActionType.Load, ActionType.Fire].includes(a)
    );
  }

  const allActionsUsed = selectedActions.actionTypes.every((a) => a !== ActionType.None);
  const disabled = actionsExecuted || allActionsUsed;
  const damagedCannons = useComponentValue(DamagedCannonsLocal, shipEntity, { value: 0 }).value > 0;
  return (
    <>
      {!damagedCannons &&
        cannonEntities.map((cannonEntity) => {
          const loaded = getComponentValue(Loaded, cannonEntity)?.value;
          const cannonRotation = getComponentValue(Rotation, cannonEntity)?.value || 0;

          const selected = !actionsExecuted && selectedActions.specialEntities.includes(world.entities[cannonEntity]);
          const key = `cannonOption-${cannonEntity}`;

          const actionType = loaded ? ActionType.Fire : ActionType.Load;
          const showFire = loaded ? !actionsExecuted : actionsExecuted;
          const actionStr = showFire ? `Fire` : `Load`;
          const broadside = isBroadside(cannonRotation);
          const typeStr = broadside ? "Broadside" : "Pivot Gun";
          const imgRotation = !showFire || broadside ? 0 : cannonRotation;

          let image = ActionImg[showFire ? ActionType.Fire : ActionType.Load];
          if (broadside && showFire) {
            image = cannonRotation == 90 ? "/icons/fire-right.svg" : "/icons/fire-left.svg";
          }

          return (
            <ActionButton
              selected={selected}
              disabled={disabled}
              executed={actionsExecuted}
              key={key}
              actionType={actionType}
              imgRotation={imgRotation}
              specialEntity={cannonEntity}
              handleClick={handleNewActionsCannon}
              image={image}
              subtitle={`${actionStr} ${typeStr}`}
            />
          );
        })}

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
        onMouseEnter={() =>
          setComponent(HoveredAction, godEntity, { shipEntity: shipEntity, actionType, specialEntity })
        }
        onMouseLeave={() => removeComponent(HoveredAction, godEntity)}
        onClick={(e) => {
          e.stopPropagation();
          handleClick(actionType, specialEntity || shipEntity);
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
