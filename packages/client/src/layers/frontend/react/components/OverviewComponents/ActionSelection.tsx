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
import { ActionImg, ActionNames, ActionType, Layers } from "../../../../../types";
import { isBroadside } from "../../../../../utils/trig";
import { DELAY } from "../../../constants";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: { SelectedActions, SelectedShip, HoveredAction, ExecutedActions },
      utils: { checkActionPossible },
      godIndex,
    },
    network: {
      components: { OwnedBy, Cannon, Rotation, Loaded, LastAction },
      utils: { getTurn, getPlayerEntity },
    },
  } = layers;

  const selectedActions = getComponentValue(SelectedActions, ship) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const actions = structuredClone(selectedActions);

  const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[ship] })])].sort(
    (a, b) => a - b
  );

  const currentTurn = getTurn(DELAY);

  const playerEntity = getPlayerEntity();
  if (!playerEntity) return null;
  const lastAction = getComponentValue(LastAction, playerEntity)?.value;

  const actionsExecuted = currentTurn == lastAction;
  const disabled = actionsExecuted || selectedActions.actionTypes.every((a) => a !== ActionType.None);

  const executedActions = getComponentValue(ExecutedActions, ship);
  const handleNewActionsCannon = (action: ActionType, cannonEntity: EntityID) => {
    const index = selectedActions.specialEntities.indexOf(cannonEntity);

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
  };

  const handleNewActionsSpecial = (action: ActionType) => {
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
    setComponent(SelectedActions, ship, { actionTypes: actions.actionTypes, specialEntities: actions.specialEntities });
    setComponent(SelectedShip, godIndex, { value: ship });
  };

  return (
    <>
      {cannonEntities.map((cannonEntity) => {
        const loaded = getComponentValue(Loaded, cannonEntity)?.value;

        const actionType = loaded ? ActionType.Fire : ActionType.Load;
        if (!checkActionPossible(ActionType.Fire, ship)) return null;
        const usedAlready = selectedActions.specialEntities.find((a) => a == world.entities[cannonEntity]) != undefined;

        const entityUsed = executedActions?.specialEntities.includes(world.entities[cannonEntity]);

        const cannonRotation = getComponentValue(Rotation, cannonEntity)?.value || 0;
        const broadside = isBroadside(cannonRotation);

        // xor
        const showFire = loaded ? !entityUsed : entityUsed;
        const actionStr = showFire ? "Fire" : "Load";
        const typeStr = entityUsed ? "" : broadside ? "Broadside" : "Pivot";
        const imgRotation = showFire || broadside ? 0 : cannonRotation;

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
            confirmed={executedActions?.specialEntities.includes(world.entities[cannonEntity])}
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
            <p style={{ lineHeight: "16px" }}>
              {actionStr} {typeStr}
            </p>
          </OptionButton>
        );
      })}
      {Object.keys(ActionType).map((a) => {
        const action = Number(a);
        if (isNaN(action)) return null;
        if (action == ActionType.Fire || action == ActionType.Load) return null;
        if (!checkActionPossible(action as ActionType, ship)) return null;
        const usedAlready = selectedActions.actionTypes.find((a) => a == action) != undefined;

        return (
          <OptionButton
            isSelected={usedAlready}
            disabled={disabled && !usedAlready}
            key={`selectedAction-${action}`}
            confirmed={executedActions?.actionTypes.includes(action)}
            onClick={(e) => {
              e.stopPropagation();
              handleNewActionsSpecial(action);
            }}
          >
            <Img style={{ height: "70%" }} src={ActionImg[action]} />
            <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
          </OptionButton>
        );
      })}
    </>
  );
};
