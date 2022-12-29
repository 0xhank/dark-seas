import { GodID } from "@latticexyz/network";
import { EntityID, EntityIndex, getComponentValue, Has, HasValue, runQuery, setComponent } from "@latticexyz/recs";
import { ActionImg, ActionNames, ActionType, Layers } from "../../../../../types";
import { Img, OptionButton } from "../../styles/global";

export const ActionSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    backend: {
      world,
      components: { SelectedActions, SelectedShip },
      utils: { checkActionPossible },
    },
    network: {
      components: { OwnedBy, Cannon },
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
    if (action != ActionType.Fire) return;

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
        if (!checkActionPossible(ActionType.Fire, ship)) return null;
        const usedAlready = selectedActions.specialEntities.find((a) => a == world.entities[cannonEntity]) != undefined;
        return (
          <OptionButton
            isSelected={usedAlready}
            disabled={disabled && !usedAlready}
            key={`selectedCannon-${cannonEntity}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNewActionsCannon(ActionType.Fire, world.entities[cannonEntity]);
            }}
          ></OptionButton>
        );
      })}
      {Object.keys(ActionType).map((a) => {
        const action = Number(a);
        if (isNaN(action)) return null;
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
            <Img src={ActionImg[action]} />
            <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
          </OptionButton>
        );
      })}
    </>
  );
};
