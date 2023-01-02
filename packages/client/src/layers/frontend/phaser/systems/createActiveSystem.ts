import {
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
  UpdateType,
} from "@latticexyz/recs";
import { ActionType, Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderCircle, renderFiringArea } from "./renderShip";

export function createActiveSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, Loaded, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedShip, SelectedActions, HoveredShip, HoveredAction },
        godIndex,
      },
    },
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
  } = phaser;

  defineSystem(world, [Has(HoveredShip)], ({ type }) => {
    let hoveredGroup = polygonRegistry.get("hoveredGroup");
    if (hoveredGroup) hoveredGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntity = getComponentValueStrict(HoveredShip, godIndex).value as EntityIndex;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    renderCircle(phaser, hoveredGroup, position, length, rotation, colors.goldHex, 0.5);

    polygonRegistry.set("hoveredGroup", hoveredGroup);
  });

  defineSystem(world, [Has(HoveredAction)], (update) => {
    if (update.type == UpdateType.Exit) return;
    const hoveredAction = update.value[0] as
      | { shipEntity: EntityIndex; actionType: ActionType; specialEntity: EntityIndex }
      | undefined;

    console.log("hoveredAction:", hoveredAction);
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

    let tint = colors.whiteHex;
    const alpha = 0.3;
    const loaded = getComponentValue(Loaded, cannonEntity);

    tint = !loaded ? colors.goldHex : colors.cannonReadyHex;

    console.log("tint:", tint);
    console.log("alpha:", alpha);
    renderFiringArea(phaser, hoveredGroup, position, rotation, length, cannonEntity, tint, alpha);

    polygonRegistry.set(objectId, hoveredGroup);
  });

  defineExitSystem(world, [Has(HoveredAction)], (update) => {
    const objectId = `hoveredFiringArea`;

    polygonRegistry.get(objectId)?.clear(true, true);
  });

  // defineSystem(world, [Has(SelectedShip)], (update) => {
  //   const activeGroup = polygonRegistry.get("activeGroup") || phaserScene.add.group();
  //   activeGroup.clear(true, true);
  //   if (update.type == UpdateType.Exit) {
  //     return;
  //   }

  //   const shipEntity = update.value[0]?.value as EntityIndex | undefined;
  //   if (!shipEntity) return;

  //   const position = getComponentValueStrict(Position, shipEntity);
  //   const length = getComponentValueStrict(Length, shipEntity).value;
  //   const rotation = getComponentValueStrict(Rotation, shipEntity).value;

  //   renderCircle(phaser, activeGroup, position, length, rotation, colors.goldHex, 0.5);
  // });

  defineSystem(world, [Has(SelectedShip)], ({ type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

    const shipEntity = getComponentValue(SelectedShip, godIndex)?.value as EntityIndex | undefined;
    if (!shipEntity) return;

    const activeGroup = polygonRegistry.get("selectedActions") || phaserScene.add.group();
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
        alpha = 0.5;
      } else if (loaded) {
        tint = colors.greenHex;
        alpha = 0.5;
      }

      const position = getComponentValueStrict(Position, shipEntity);
      const length = getComponentValueStrict(Length, shipEntity).value;
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;

      renderFiringArea(phaser, activeGroup, position, rotation, length, cannonEntity, tint, alpha);
    });

    polygonRegistry.set("selectedActions", activeGroup);
  });
}
