import {
  defineComponentSystem,
  defineExitSystem,
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
import { ActionType, Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { getRangeTintAlpha, renderFiringArea } from "./renderShip";

export function createActionSelectionSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, Loaded, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        utils: { getTargetedShips, isMyShip, handleNewActionsCannon },
        components: { SelectedActions, SelectedShip, HoveredAction, Targeted, DamagedCannonsLocal },
        godIndex,
      },
    },
    utils: { getGroupObject, destroyGroupObject },
  } = phaser;

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

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const loaded = getComponentValue(Loaded, cannonEntity)?.value;

    const strokeFill = { tint: loaded ? colors.cannonReadyHex : colors.goldHex, alpha: 0.5 };

    renderFiringArea(phaser, hoveredGroup, position, rotation, length, cannonEntity, undefined, strokeFill);

    // make targeted ships red

    if (actionType != ActionType.Fire) return;
    getTargetedShips(cannonEntity).forEach((entity) => {
      const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
      setComponent(Targeted, entity, { value: targetedValue + 1 });
    });
  });

  defineExitSystem(world, [Has(HoveredAction)], (update) => {
    const prevValue = update.value[1];
    if (!prevValue) return;

    const cannonEntity = prevValue.specialEntity as EntityIndex;
    const objectId = "hoveredFiringArea";

    destroyGroupObject(objectId);
    getTargetedShips(cannonEntity).forEach((entity) => {
      const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
      if (!targetedValue) return;
      setComponent(Targeted, entity, { value: targetedValue - 1 });
    });
  });

  defineComponentSystem(world, SelectedActions, ({ value, entity: shipEntity }) => {
    const diff = getDiff(value[1], value[0]);

    if (diff) {
      getTargetedShips(diff.entity).forEach((entity) => {
        const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
        setComponent(Targeted, entity, { value: diff.added ? targetedValue + 1 : Math.max(0, targetedValue - 1) });
      });
    }
    // renderCannons(shipEntity);
  });

  // this is probably the worst code ive ever written
  // finds the added or deleted cannon with Fire action type
  function getDiff(
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
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const phase: Phase | undefined = getPhase(DELAY);
    const isMine = isMyShip(shipEntity);
    if (phase == Phase.Commit && isMine) return;

    renderCannons(shipEntity);
  });

  defineExitSystem(world, [Has(SelectedShip)], () => {
    clearCannons();
  });

  function clearCannons() {
    destroyGroupObject("selectedActions");
    destroyGroupObject("hoveredFiringArea");
  }

  function renderCannons(shipEntity: EntityIndex) {
    const groupId = "selectedActions";
    const activeGroup = getGroupObject(groupId, true);

    const selectedActions = getComponentValue(SelectedActions, shipEntity);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];
    const damagedCannons = getComponentValue(DamagedCannonsLocal, shipEntity)?.value != 0;

    cannonEntities.forEach((cannonEntity) => {
      const loaded = getComponentValue(Loaded, cannonEntity);
      const cannonSelected = selectedActions?.specialEntities.includes(world.entities[cannonEntity]);

      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const rangeColor = getRangeTintAlpha(!!loaded, !!cannonSelected, damagedCannons);
      const firingPolygon = renderFiringArea(phaser, activeGroup, position, rotation, length, cannonEntity, rangeColor);
      const actionType = loaded ? ActionType.Fire : ActionType.Load;

      firingPolygon.setInteractive(firingPolygon.geom, Phaser.Geom.Polygon.Contains);
      firingPolygon.on("pointerdown", () => handleNewActionsCannon(actionType, cannonEntity));
      firingPolygon.on("pointerover", () =>
        setComponent(HoveredAction, godIndex, { shipEntity, actionType, specialEntity: cannonEntity })
      );
      firingPolygon.on("pointerout", () => removeComponent(HoveredAction, godIndex));
    });
  }
}
