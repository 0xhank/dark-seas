import {
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
import { renderCircle, renderFiringArea } from "./renderShip";

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
        components: { SelectedShip, SelectedActions, HoveredShip, HoveredAction, Targeted },
        godIndex,
      },
    },
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
  } = phaser;

  defineSystem(world, [Has(SelectedShip)], ({ type }) => {
    const groupId = "circle";
    let hoveredGroup = polygonRegistry.get(groupId);
    if (hoveredGroup) hoveredGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntity = getComponentValueStrict(SelectedShip, godIndex).value as EntityIndex;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    renderCircle(phaser, hoveredGroup, position, length, rotation, colors.goldHex, 0.5);

    polygonRegistry.set(groupId, hoveredGroup);
  });

  defineSystem(world, [Has(HoveredShip)], ({ type }) => {
    const groupId = "hover-circle";
    let hoveredGroup = polygonRegistry.get(groupId);
    if (hoveredGroup) hoveredGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntity = getComponentValueStrict(HoveredShip, godIndex).value as EntityIndex;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    renderCircle(phaser, hoveredGroup, position, length, rotation, colors.whiteHex, 0.3);

    polygonRegistry.set(groupId, hoveredGroup);
  });

  defineSystem(world, [Has(HoveredAction)], (update) => {
    if (update.type == UpdateType.Exit) return;
    const hoveredAction = update.value[0] as
      | { shipEntity: EntityIndex; actionType: ActionType; specialEntity: EntityIndex }
      | undefined;

    if (!hoveredAction) return;

    const actionType = hoveredAction.actionType;
    if (actionType != ActionType.Fire && actionType != ActionType.Load) return;

    const shipEntity = hoveredAction.shipEntity;
    const cannonEntity = hoveredAction.specialEntity;

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

  defineSystem(world, [Has(SelectedActions)], (update) => {
    const oldEntities = update.value[1]?.specialEntities as EntityID[] | undefined;
    const newEntities = update.value[0]?.specialEntities as EntityID[] | undefined;

    const diff = getDiff(oldEntities, newEntities);

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
    oldEntities: EntityID[] | undefined,
    newEntities: EntityID[] | undefined
  ): { entity: EntityIndex; added: boolean } | undefined {
    if (!oldEntities && !newEntities) return;
    if (!oldEntities && newEntities) {
      const entityID = newEntities.find((e) => e !== "0");

      if (!entityID) return;
      const entity = world.entityToIndex.get(entityID);
      if (!entity) return;
      return { entity, added: true };
    }
    if (oldEntities && !newEntities) {
      const entityID = oldEntities.find((e) => e !== "0");
      if (!entityID) return;
      const entity = world.entityToIndex.get(entityID);
      if (!entity) return;
      return { entity, added: false };
    }
    if (oldEntities && newEntities) {
      const oldAddition = oldEntities.find((v) => v !== "0" && !newEntities.includes(v));
      const newAddition = newEntities.find((v) => v !== "0" && !oldEntities.includes(v));

      if (oldAddition) {
        const entity = world.entityToIndex.get(oldAddition);

        if (!entity) return;
        return { entity, added: false };
      } else if (newAddition) {
        const entity = world.entityToIndex.get(newAddition);
        if (!entity) return;
        return { entity, added: true };
      }
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
