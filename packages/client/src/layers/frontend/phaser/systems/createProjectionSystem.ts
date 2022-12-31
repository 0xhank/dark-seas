import {
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentEntities,
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

    renderShip(phaser, shipEntity, `projection-${shipEntity}`, finalPosition, finalRotation, 0xffc415, 0.7);
  });

  /* ---------------------------------------------- Hovered Move update --------------------------------------------- */

  defineSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[0] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;

    if (!hoveredMove) return;
    console.log("hovered move:", hoveredMove.shipEntity);

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
      renderFiringArea(phaser, rangeGroup, finalPosition, finalRotation, length, cannonEntity, 0xffffff, 0.1);
    });
    polygonRegistry.set(objectId, rangeGroup);

    renderShip(phaser, shipEntity, `hoverGhost-${shipEntity}`, finalPosition, finalRotation, 0xffffff, 0.5);
  });

  defineExitSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[1] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;
    if (!hoveredMove) return;
    const objectId = `hoverGhost-${hoveredMove.shipEntity}`;
    console.log("removing hovering from", hoveredMove.shipEntity);

    objectPool.remove(objectId);
    polygonRegistry.get(objectId)?.clear(true, true);
  });

  /* ---------------------------------------------- Move Options update ------------------------------------------- */
  defineSystem(world, [Has(SelectedShip)], (update) => {
    if (update.type == UpdateType.Exit) return;
    const shipEntity = getComponentValueStrict(SelectedShip, godIndex).value as EntityIndex;

    const objectId = `hoverGhost-${shipEntity}`;
    const rangeGroup = polygonRegistry.get(objectId) || phaserScene.add.group();

    rangeGroup.clear(true, true);

    const moveCardEntities = [...getComponentEntities(MoveCard)];

    moveCardEntities.map((moveCardEntity) => {
      const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
      const position = getComponentValueStrict(Position, shipEntity);
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const wind = getComponentValueStrict(Wind, godIndex);
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
      const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);

      renderShip(
        phaser,
        shipEntity,
        `optionGhost-${shipEntity}-${moveCardEntity}`,
        finalPosition,
        finalRotation,
        0xffffff,
        0.3
      );
    });
  });

  defineExitSystem(world, [Has(SelectedShip)], (update) => {
    const shipEntity = update.value[1]?.value as EntityIndex | undefined;
    if (!shipEntity) return;

    const moveCardEntities = [...getComponentEntities(MoveCard)];

    moveCardEntities.map((moveCardEntity) => {
      objectPool.remove(`optionGhost-${shipEntity}-${moveCardEntity}`);
    });
  });
}
