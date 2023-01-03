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
import { Phase } from "../../../../types";
import { getFinalPosition } from "../../../../utils/directions";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderFiringArea, renderShip } from "./renderShip";

export function createProjectionSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Wind, Position, Range, Length, Rotation, SailPosition, MoveCard, Health, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedMove, HoveredMove, SelectedShip },
        godIndex,
      },
    },
    scenes: {
      Main: { objectPool, phaserScene },
    },
    polygonRegistry,
  } = phaser;

  /* --------------------------------------------- Selected Move update --------------------------------------------- */
  defineExitSystem(world, [Has(SelectedMove)], ({ entity: shipEntity }) => {
    const rangeGroup = polygonRegistry.get(`rangeGroup-${shipEntity}`);
    if (rangeGroup) rangeGroup.clear(true, true);

    objectPool.remove(`projection-${shipEntity}`);
  });

  defineSystem(world, [Has(SelectedMove)], ({ entity: shipEntity, type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

    if (phase == undefined || phase == Phase.Action) return;

    if (type == UpdateType.Exit) return;

    const moveCardEntity = getComponentValue(SelectedMove, shipEntity);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const wind = getComponentValueStrict(Wind, godIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);

    renderShip(phaser, shipEntity, `projection-${shipEntity}`, finalPosition, finalRotation, colors.goldHex, 0.7);
  });

  /* ---------------------------------------------- Hovered Move update --------------------------------------------- */

  defineSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[0] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;

    if (!hoveredMove) return;

    const shipEntity = hoveredMove.shipEntity;
    const moveCardEntity = hoveredMove.moveCardEntity;

    const objectId = `hoverGhost-${shipEntity}`;
    const rangeGroup = polygonRegistry.get(objectId) || phaserScene.add.group();

    rangeGroup.clear(true, true);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value;
    const wind = getComponentValueStrict(Wind, godIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      renderFiringArea(phaser, rangeGroup, finalPosition, finalRotation, length, cannonEntity, colors.whiteHex, 0.1);
    });
    polygonRegistry.set(objectId, rangeGroup);

    renderShip(phaser, shipEntity, `hoverGhost-${shipEntity}`, finalPosition, finalRotation, colors.whiteHex, 0.5);
  });

  defineExitSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[1] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;
    if (!hoveredMove) return;
    const objectId = `hoverGhost-${hoveredMove.shipEntity}`;

    objectPool.remove(objectId);
    polygonRegistry.get(objectId)?.clear(true, true);
  });
}
