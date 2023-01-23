import {
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import styled from "styled-components";
import { ActionImg, ActionNames, ActionType, Layers } from "../../../../../types";
import { isBroadside } from "../../../../../utils/trig";
import { DELAY } from "../../../constants";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: {
        SelectedActions,
        SelectedShip,
        HoveredAction,
        ExecutedActions,
        ExecutedCannon,
        DamagedCannonsLocal,
      },
      utils: { checkActionPossible },
      godIndex,
    },
    network: {
      components: { OwnedBy, Cannon, Rotation, Loaded, LastAction },
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

  let cannonEntities: EntityIndex[] = [];
  let actions: ActionType[] = [];

  if (!actionsExecuted) {
    cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[ship] })])].sort(
      (a, b) =>
        ((180 + getComponentValueStrict(Rotation, a).value) % 360) -
        ((180 + getComponentValueStrict(Rotation, b).value) % 360)
    );

    actions = Object.keys(ActionType)
      .map((action) => Number(action))
      .filter((a) => checkActionPossible(a, ship));
  } else {
    cannonEntities = [
      ...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[ship] }), Has(ExecutedCannon)]),
    ].sort(
      (a, b) =>
        ((180 + getComponentValueStrict(Rotation, a).value) % 360) -
        ((180 + getComponentValueStrict(Rotation, b).value) % 360)
    );
    actions = (getComponentValue(ExecutedActions, ship)?.value || []).filter(
      (a) => !isNaN(a) && ![ActionType.None, ActionType.Load, ActionType.Fire].includes(a)
    );
  }

  const allActionsUsed = selectedActions.actionTypes.every((a) => a !== ActionType.None);
  const disabled = actionsExecuted || allActionsUsed;
  const damagedCannons = (getComponentValue(DamagedCannonsLocal, ship)?.value || 0) > 0;
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
        const selected = !actionsExecuted && selectedActions.actionTypes.find((a) => a == action) != undefined;
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
    key,
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
    key: string;
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
        key={key}
        onMouseEnter={() => setComponent(HoveredAction, godIndex, { shipEntity: ship, actionType, specialEntity })}
        onMouseLeave={() => removeComponent(HoveredAction, godIndex)}
        onClick={(e) => {
          e.stopPropagation();
          handleClick(actionType, specialEntity);
        }}
      >
        <Img src={image} style={{ height: "70%", transform: `rotate(${imgRotation}deg)` }} />
        <Sub>{subtitle}</Sub>
      </OptionButton>
    );
  }

  function handleNewActionsCannon(action: ActionType, cannonEntity: EntityIndex) {
    const actions = structuredClone(selectedActions);
    const entityID = world.entities[cannonEntity];
    const index = actions.specialEntities.indexOf(entityID);

    // couldn't find the cannon
    if (index == -1) {
      const unusedSlot = selectedActions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      actions.actionTypes[unusedSlot] = action;
      actions.specialEntities[unusedSlot] = entityID;
    } else {
      actions.actionTypes[index] = ActionType.None;
      actions.specialEntities[index] = "0" as EntityID;
    }
    setComponent(SelectedActions, ship, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(SelectedShip, godIndex, { value: ship });
  }

  function handleNewActionsSpecial(action: ActionType, cannonEntity: EntityIndex) {
    const actions = structuredClone(selectedActions);
    const index = actions.actionTypes.indexOf(action);
    if (index == -1) {
      const unusedSlot = actions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      actions.actionTypes[unusedSlot] = action;
      actions.specialEntities[unusedSlot] = "0" as EntityID;
    } else {
      actions.actionTypes[index] = ActionType.None;
      actions.specialEntities[index] = "0" as EntityID;
    }
    setComponent(SelectedActions, ship, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(SelectedShip, godIndex, { value: ship });
  }
};

const Sub = styled.p`
  line-height: 1rem;
  font-size: 0.8rem;
`;
