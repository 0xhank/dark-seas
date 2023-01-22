import {
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  hasComponent,
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
      components: { SelectedActions, SelectedShip, HoveredAction, ExecutedActions, ExecutedCannon },
      utils: { checkActionPossible },
      godIndex,
    },
    network: {
      components: { OwnedBy, Cannon, Rotation, Loaded, LastAction },
      utils: { getPlayerEntity, getTurn },
    },
  } = layers;

  const currentTurn = getTurn(DELAY);

  const selectedActions = getComponentValue(SelectedActions, ship) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const playerEntity = getPlayerEntity();
  if (!playerEntity) return null;
  const lastAction = getComponentValue(LastAction, playerEntity)?.value;

  const executedActions = currentTurn == lastAction;
  const disabled = selectedActions.actionTypes.every((a) => a !== ActionType.None);

  const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[ship] })])].sort(
    (a, b) =>
      ((180 + getComponentValueStrict(Rotation, a).value) % 360) -
      ((180 + getComponentValueStrict(Rotation, b).value) % 360)
  );

  if (executedActions) {
    const executedCannons = cannonEntities.filter((entity) => hasComponent(ExecutedCannon, entity));
    const executedActions = getComponentValue(ExecutedActions, ship)?.value;
    console.log("executed cannons:", executedCannons);
    return (
      <>
        {executedCannons.map((cannonEntity) => (
          <CannonOptions cannonEntity={cannonEntity} executed key={`executedCannon-${cannonEntity}`} />
        ))}

        {executedActions?.map((a) => {
          if (a == ActionType.Load || a == ActionType.Fire) return null;
          return (
            <OptionButton disabled confirmed key={`executedaction-${a}`}>
              <Img src={ActionImg[a]} style={{ height: "70%" }} />
              <Sub>{ActionNames[a]}</Sub>
            </OptionButton>
          );
        })}
      </>
    );
  }
  return (
    <>
      {cannonEntities.map((cannonEntity) => (
        <CannonOptions cannonEntity={cannonEntity} key={`cannonOption-${cannonEntity}`} />
      ))}

      {Object.keys(ActionType).map((a) => (
        <ActionOptions actionType={a} key={`actionOption-${a}`} />
      ))}
    </>
  );

  function handleNewActionsCannon(action: ActionType, cannonEntity: EntityID) {
    const actions = structuredClone(selectedActions);

    const index = actions.specialEntities.indexOf(cannonEntity);

    // couldn't find the cannon
    if (index == -1) {
      const unusedSlot = selectedActions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      actions.actionTypes[unusedSlot] = action;
      actions.specialEntities[unusedSlot] = cannonEntity;
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

  function CannonOptions({ cannonEntity, executed = false }: { cannonEntity: EntityIndex; executed?: boolean }) {
    const loaded = getComponentValue(Loaded, cannonEntity)?.value;

    const actionType = loaded ? ActionType.Fire : ActionType.Load;
    if (!checkActionPossible(ActionType.Fire, ship)) return null;

    const usedAlready = !executed && selectedActions.specialEntities.includes(world.entities[cannonEntity]);

    const cannonRotation = getComponentValue(Rotation, cannonEntity)?.value || 0;
    const broadside = isBroadside(cannonRotation);

    // xor
    const showFire = loaded ? !executed : executed;
    const actionStr = showFire ? `Fire` : `Load`;
    const typeStr = broadside ? "Broadside" : "Pivot Gun";
    const imgRotation = !showFire || broadside ? 0 : cannonRotation;

    let src = ActionImg[ActionType.Load];
    if (showFire) {
      src = ActionImg[ActionType.Fire];
      if (broadside) {
        src = cannonRotation == 90 ? "/icons/fire-right.svg" : "/icons/fire-left.svg";
      }
    }

    return (
      <OptionButton
        isSelected={usedAlready}
        disabled={disabled && !usedAlready}
        confirmed={executed}
        key={`selectedCannon-${cannonEntity}`}
        onMouseEnter={() =>
          setComponent(HoveredAction, godIndex, { shipEntity: ship, actionType, specialEntity: cannonEntity })
        }
        onMouseLeave={() => removeComponent(HoveredAction, godIndex)}
        onClick={(e) => {
          e.stopPropagation();
          handleNewActionsCannon(loaded ? ActionType.Fire : ActionType.Load, world.entities[cannonEntity]);
        }}
      >
        <Img src={src} style={{ height: "70%", transform: `rotate(${imgRotation}deg)` }} />
        <Sub>
          {actionStr} {typeStr}
        </Sub>
      </OptionButton>
    );
  }

  function handleNewActionsSpecial(action: ActionType) {
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

  function ActionOptions({ actionType }: { actionType: string }) {
    const action = Number(actionType);
    if (isNaN(action)) return null;
    if (action == ActionType.Fire || action == ActionType.Load) return null;
    if (!checkActionPossible(action as ActionType, ship)) return null;
    const usedAlready = selectedActions.actionTypes.find((a) => a == action) != undefined;
    const actionExecuted = !!executedActions;
    return (
      <OptionButton
        isSelected={usedAlready}
        disabled={disabled && !usedAlready}
        key={`selectedAction-${action}`}
        confirmed={actionExecuted && usedAlready}
        onClick={(e) => {
          e.stopPropagation();
          handleNewActionsSpecial(action);
        }}
        onMouseEnter={() =>
          setComponent(HoveredAction, godIndex, { shipEntity: ship, actionType: action, specialEntity: 0 })
        }
        onMouseLeave={() => removeComponent(HoveredAction, godIndex)}
      >
        <Img style={{ height: "70%" }} src={ActionImg[action]} />
        <Sub>{ActionNames[action]}</Sub>
      </OptionButton>
    );
  }
};

const Sub = styled.p`
  line-height: 1rem;
  font-size: 0.8rem;
`;
