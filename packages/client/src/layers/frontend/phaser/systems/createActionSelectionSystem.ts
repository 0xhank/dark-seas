import {
  defineComponentSystem,
  defineExitSystem,
  defineSystem,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { ActionType, Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderFiringArea } from "./renderShip";

export function createActionSelectionSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, Loaded, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        utils: { getTargetedShips },
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

    const tint = colors.whiteHex;
    const alpha = 0.1;

    renderFiringArea(phaser, hoveredGroup, position, rotation, length, cannonEntity, tint, alpha);

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

  defineComponentSystem(world, SelectedActions, (update) => {
    const oldValue = update.value[1]?.specialEntities.map((e, i) => [e, update.value[1]?.actionTypes[i]]) as
      | [EntityID, ActionType][]
      | undefined;
    const newValue = update.value[0]?.specialEntities.map((e, i) => [e, update.value[0]?.actionTypes[0]]) as
      | [EntityID, ActionType][]
      | undefined;

    const diff = getDiff(oldValue, newValue);

    console.log("cannon updated:", diff);
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

  function getDiff(
    oldEntities: [EntityID, ActionType][] | undefined,
    newEntities: [EntityID, ActionType][] | undefined
  ): { entity: EntityIndex; added: boolean } | undefined {
    const oldAddition = oldEntities?.find(
      (candidate) => candidate[1] == ActionType.Fire && !newEntities?.find((entity) => entity[0] == candidate[0])
    );
    if (oldAddition) {
      const entity = world.entityToIndex.get(oldAddition[0]);
      if (!entity) return;
      return { entity, added: false };
    }
    const newAddition = newEntities?.find(
      (candidate) => candidate[1] == ActionType.Fire && !oldEntities?.find((entity) => entity[0] == candidate[0])
    );
    if (newAddition) {
      const entity = world.entityToIndex.get(newAddition[0]);
      if (!entity) return;
      return { entity, added: true };
    }
  }

  defineSystem(world, [Has(HoveredShip)], ({ type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

    if (phase !== Phase.Action) return;
    const shipEntity = getComponentValue(HoveredShip, godIndex)?.value as EntityIndex | undefined;
    if (!shipEntity) return;

    const groupId = "selectedActions";
    const activeGroup = polygonRegistry.get(groupId) || phaserScene.add.group();
    activeGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const selectedActions = getComponentValue(SelectedActions, shipEntity);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      let tint = colors.whiteHex;
      let alpha = 0.1;
      const loaded = getComponentValue(Loaded, cannonEntity);
      const cannonSelected = selectedActions?.specialEntities.includes(world.entities[cannonEntity]);

      if (cannonSelected) {
        tint = loaded ? colors.cannonReadyHex : colors.goldHex;
        alpha = 0.3;
      } else if (loaded) {
        tint = colors.goldHex;
        alpha = 0.5;
      }

      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;

      renderFiringArea(phaser, activeGroup, position, rotation, length, cannonEntity, tint, alpha);
    });

    polygonRegistry.set(groupId, activeGroup);
  });

  defineExitSystem(world, [Has(HoveredShip)], (update) => {
    polygonRegistry.get("selectedActions")?.clear(true, true);
  });
}
