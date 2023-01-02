import { GodID } from "@latticexyz/network";
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
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: { SelectedActions, SelectedShip, HoveredAction },
      utils: { checkActionPossible },
    },
    network: {
      components: { OwnedBy, Cannon, Rotation, Loaded },
    },
  } = layers;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const selectedActions = getComponentValue(SelectedActions, ship) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[ship] })])];

  const disabled = selectedActions.actionTypes.every((a) => a !== ActionType.None);

  const handleNewActionsCannon = (action: ActionType, cannonEntity: EntityID) => {
    const index = selectedActions.specialEntities.indexOf(cannonEntity);

    // couldn't find the cannon
    if (index == -1) {
      const unusedSlot = selectedActions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      selectedActions.actionTypes[unusedSlot] = action;
      selectedActions.specialEntities[unusedSlot] = cannonEntity;
    } else {
      selectedActions.actionTypes[index] = ActionType.None;
      selectedActions.specialEntities[index] = "0" as EntityID;
    }
    setComponent(SelectedActions, ship, {
      actionTypes: selectedActions.actionTypes,
      specialEntities: selectedActions.specialEntities,
    });
    setComponent(SelectedShip, GodEntityIndex, { value: ship });
  };

  const handleNewActionsSpecial = (action: ActionType) => {
    const actions = selectedActions;
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
    setComponent(SelectedShip, GodEntityIndex, { value: ship });
  };

  return (
    <>
      {cannonEntities.map((cannonEntity) => {
        const loaded = getComponentValue(Loaded, cannonEntity)?.value;

        const actionType = loaded ? ActionType.Fire : ActionType.Load;
        if (!checkActionPossible(ActionType.Fire, ship)) return null;
        const usedAlready = selectedActions.specialEntities.find((a) => a == world.entities[cannonEntity]) != undefined;

        const cannonRotation = getComponentValue(Rotation, cannonEntity)?.value || 0;
        const broadside = isBroadside(cannonRotation);
        const actionStr = loaded ? "Fire" : "Load";
        const typeStr = broadside ? "Broadside" : "Pivot";
        const imgRotation = !loaded || broadside ? 0 : cannonRotation;

        let src = ActionImg[ActionType.Load];
        if (loaded) {
          src = ActionImg[ActionType.Fire];
          if (broadside) {
            src = cannonRotation == 90 ? "/icons/fire-right.svg" : "/icons/fire-left.svg";
          }
        }

        return (
          <OptionButton
            isSelected={usedAlready}
            disabled={disabled && !usedAlready}
            key={`selectedCannon-${cannonEntity}`}
            onMouseEnter={() =>
              setComponent(HoveredAction, GodEntityIndex, { shipEntity: ship, actionType, specialEntity: cannonEntity })
            }
            onMouseLeave={() => removeComponent(HoveredAction, GodEntityIndex)}
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
