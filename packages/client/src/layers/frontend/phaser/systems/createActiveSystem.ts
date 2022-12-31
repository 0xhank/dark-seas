import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
  UpdateType,
} from "@latticexyz/recs";
import { Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { PhaserLayer } from "../types";
import { renderCircle, renderFiringArea } from "./renderShip";

export function createActiveSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, Range, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedShip, SelectedActions, HoveredShip },
      },
    },
    polygonRegistry,
    positions,
    scenes: {
      Main: { phaserScene },
    },
  } = phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  defineSystem(world, [Has(HoveredShip)], ({ type }) => {
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    let hoveredGroup = polygonRegistry.get("hoveredGroup");
    if (hoveredGroup) hoveredGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntity = getComponentValueStrict(HoveredShip, GodEntityIndex).value as EntityIndex;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    renderCircle(phaser, hoveredGroup, position, length, rotation, 0xffc415, 0.5);

    polygonRegistry.set("hoveredGroup", hoveredGroup);
  });

  defineSystem(world, [Has(SelectedShip)], ({ type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

    if (phase == undefined) return;

    const activeGroup = polygonRegistry.get("activeGroup") || phaserScene.add.group();
    activeGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntity = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;

    renderCircle(phaser, activeGroup, position, length, rotation, 0xffc415, 0.5);

    if (phase == Phase.Action) {
      const selectedActions = getComponentValue(SelectedActions, shipEntity);
      const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

      cannonEntities.forEach((cannonEntity) => {
        const tint =
          selectedActions && selectedActions.specialEntities.includes(world.entities[cannonEntity])
            ? 0xf33a6a
            : 0xffffff;
        renderFiringArea(phaser, activeGroup, position, rotation, length, cannonEntity, tint, 0.3);
      });
      polygonRegistry.set("activeGroup", activeGroup);
      const firingPolygons = cannonEntities.map((cannonEntity) => {
        const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;
        const range = getComponentValueStrict(Range, cannonEntity).value;

        const firingArea = getFiringArea(
          pixelPosition,
          range * positions.posHeight,
          length * positions.posHeight,
          rotation,
          cannonRotation
        );

        const firingPolygon = phaserScene.add.polygon(undefined, undefined, firingArea, 0xffffff, 0.1);
        firingPolygon.setDisplayOrigin(0);
        firingPolygon.setDepth(RenderDepth.Foreground5);

        // TODO:  make this occur on action selection update, not selectedship update

        if (selectedActions && selectedActions.specialEntities.includes(world.entities[cannonEntity])) {
          firingPolygon.setFillStyle(0xf33a6a, 0.2);
        }

        return firingPolygon;
      });

      activeGroup.addMultiple(firingPolygons, true);
    }

    activeGroup.add(circle, true);

    polygonRegistry.set("activeGroup", activeGroup);
  });
}
