import {
  defineComponentSystem,
  defineExitSystem,
  EntityID,
  EntityIndex,
  getComponentValue,
  Has,
  setComponent,
} from "@latticexyz/recs";
import { world } from "../mud/world";
import { colors } from "../react/styles/global";
import { ActionType, SetupResult } from "../types";

export function firingAreaSystems(MUD: SetupResult) {
  const {
    components: { Position, Length, Rotation, Loaded, SelectedActions, SelectedShip, HoveredAction, Targeted },
    network: { clock },
    utils: {
      getGroupObject,
      destroyGroupObject,
      getPhase,
      getTargetedShips,
      destroyShip,
      renderShipFiringAreas,
      renderCannonFiringArea,
    },
  } = MUD;

  defineComponentSystem(world, HoveredAction, ({ value }) => {
    const hoveredAction = value[0];

    if (!hoveredAction) return;
    const actionType = hoveredAction.actionType;
    if (actionType != ActionType.Fire && actionType != ActionType.Load) return;

    const shipEntity = hoveredAction.shipEntity as EntityIndex;
    const cannonEntity = hoveredAction.specialEntity as EntityIndex;

    const objectId = "hoveredFiringArea";

    const hoveredGroup = getGroupObject(objectId, true);
    if (!shipEntity || !cannonEntity) return;

    const loaded = getComponentValue(Loaded, cannonEntity)?.value;

    const strokeFill = { tint: loaded ? colors.cannonReadyHex : colors.goldHex, alpha: 0.5 };
    renderCannonFiringArea(hoveredGroup, shipEntity, cannonEntity, undefined, strokeFill);
  });

  defineComponentSystem(world, SelectedActions, ({ value, entity: shipEntity }) => {
    const groupId = "activeCannons";
    const cannonSelected = isCannonSelected(value[1], value[0]);

    if (cannonSelected) {
      getTargetedShips(cannonSelected.entity).forEach((entity) => {
        const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
        setComponent(Targeted, entity, {
          value: cannonSelected.added ? targetedValue + 1 : Math.max(0, targetedValue - 1),
        });
      });
    }

    if (value[0]) renderShipFiringAreas(shipEntity, groupId);
  });

  // this is probably the worst code ive ever written
  // finds the added or deleted cannon with Fire action type
  function isCannonSelected(
    oldActions: { specialEntities: EntityID[]; actionTypes: ActionType[] } | undefined,
    newActions: { specialEntities: EntityID[]; actionTypes: ActionType[] } | undefined
  ): { entity: EntityIndex; added: boolean } | undefined {
    const oldEntities = oldActions?.specialEntities.map((specialEntity, i) => ({
      specialEntity,
      actionType: oldActions?.actionTypes[i],
    }));
    const newEntities = newActions?.specialEntities.map((specialEntity, i) => ({
      specialEntity,
      actionType: newActions?.actionTypes[i],
    }));

    const oldAddition = oldEntities?.find(
      (candidate) =>
        candidate.actionType == ActionType.Fire &&
        !newEntities?.find((entity) => entity.specialEntity == candidate.specialEntity)
    );
    if (oldAddition) {
      const entity = world.entityToIndex.get(oldAddition.specialEntity);
      if (!entity) return;
      return { entity, added: false };
    }
    const newAddition = newEntities?.find((candidate) => {
      const fireAction = candidate.actionType == ActionType.Fire;
      const notInOld = !oldEntities?.find((entity) => entity.specialEntity == candidate.specialEntity);
      return fireAction && notInOld;
    });
    if (newAddition) {
      const entity = world.entityToIndex.get(newAddition.specialEntity);
      if (!entity) return;
      return { entity, added: true };
    }
  }

  defineComponentSystem(world, SelectedShip, (update) => {
    const groupId = "activeCannons";

    destroyGroupObject(groupId);

    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const phase = getPhase(clock.currentTime);
    renderShipFiringAreas(shipEntity, groupId);
  });

  defineExitSystem(world, [Has(SelectedShip)], () => {
    destroyGroupObject("activeCannons");
    destroyGroupObject("hoveredFiringArea");
  });
}
