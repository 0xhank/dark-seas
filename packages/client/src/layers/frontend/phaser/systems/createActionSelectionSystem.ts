import {
  defineComponentSystem,
  defineExitSystem,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
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
        components: { Position, Length, Rotation, Loaded, Cannon, OwnedBy, DamagedCannons },
        utils: { getPhase },
      },
      backend: {
        utils: { getTargetedShips, isMyShip },
        components: { SelectedActions, HoveredShip, HoveredAction, Targeted },
        godIndex,
      },
    },
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
  } = phaser;

  defineComponentSystem(world, HoveredAction, ({ value }) => {
    const hoveredAction = value[0];

    if (!hoveredAction) return;

    const actionType = hoveredAction.actionType;
    if (actionType != ActionType.Fire && actionType != ActionType.Load) return;

    const shipEntity = hoveredAction.shipEntity as EntityIndex;
    const cannonEntity = hoveredAction.specialEntity as EntityIndex;

    const objectId = `hoveredFiringArea`;

    const hoveredGroup = polygonRegistry.get(objectId) || phaserScene.add.group();

    hoveredGroup.clear(true, true);
    if (!shipEntity || !cannonEntity) return;

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const loaded = getComponentValue(Loaded, cannonEntity)?.value;

    const strokeFill = { tint: loaded ? colors.cannonReadyHex : colors.goldHex, alpha: 0.5 };

    renderFiringArea(phaser, hoveredGroup, position, rotation, length, cannonEntity, undefined, strokeFill);

    polygonRegistry.set(objectId, hoveredGroup);
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
    const objectId = `hoveredFiringArea`;

    polygonRegistry.get(objectId)?.clear(true, true);
    getTargetedShips(cannonEntity).forEach((entity) => {
      const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
      if (!targetedValue) return;
      setComponent(Targeted, entity, { value: targetedValue - 1 });
    });
  });

  defineComponentSystem(world, SelectedActions, ({ value }) => {
    const diff = getDiff(value[1], value[0]);

    if (diff) {
      getTargetedShips(diff.entity).forEach((entity) => {
        const targetedValue = getComponentValue(Targeted, entity)?.value || 0;
        setComponent(Targeted, entity, { value: diff.added ? targetedValue + 1 : Math.max(0, targetedValue - 1) });
      });
    }
    const hoveredShip = getComponentValue(HoveredShip, godIndex);
    if (!hoveredShip) return;
    setComponent(HoveredShip, godIndex, hoveredShip);
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

  defineComponentSystem(world, HoveredShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const phase: Phase | undefined = getPhase(DELAY);
    const isMine = isMyShip(shipEntity);
    if (phase == Phase.Commit && isMine) return;

    const groupId = "selectedActions";
    const activeGroup = polygonRegistry.get(groupId) || phaserScene.add.group();
    activeGroup.clear(true, true);

    const selectedActions = getComponentValue(SelectedActions, shipEntity);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];
    const damagedCannons = getComponentValue(DamagedCannons, shipEntity);

    cannonEntities.forEach((cannonEntity) => {
      const loaded = getComponentValue(Loaded, cannonEntity);
      const cannonSelected = selectedActions?.specialEntities.includes(world.entities[cannonEntity]);

      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const rangeColor = getRangeTintAlpha(!!loaded, !!cannonSelected, !!damagedCannons);
      renderFiringArea(phaser, activeGroup, position, rotation, length, cannonEntity, rangeColor);
    });

    polygonRegistry.set(groupId, activeGroup);
  });

  defineExitSystem(world, [Has(HoveredShip)], (update) => {
    polygonRegistry.get("selectedActions")?.clear(true, true);
  });
}
