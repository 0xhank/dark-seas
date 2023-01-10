import {
  defineComponentSystem,
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
import { getColorNum } from "../../../../utils/procgen";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { getRangeTintAlpha, renderFiringArea, renderShip } from "./renderShip";

export function createProjectionSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, SailPosition, MoveCard, Cannon, OwnedBy, Speed, Loaded },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedMove, HoveredMove },
        utils: { outOfBounds },
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
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);

    renderShip(
      phaser,
      shipEntity,
      `projection-${shipEntity}`,
      finalPosition,
      finalRotation,
      getColorNum(shipEntity),
      0.7
    );
  });

  /* ---------------------------------------------- Hovered Move update --------------------------------------------- */

  defineComponentSystem(world, HoveredMove, (update) => {
    const hoveredMove = update.value[0];

    if (!hoveredMove) return;

    const shipEntity = hoveredMove.shipEntity as EntityIndex;
    const moveCardEntity = hoveredMove.moveCardEntity as EntityIndex;

    const objectId = `hoverGhost-${shipEntity}`;
    const rangeGroup = polygonRegistry.get(objectId) || phaserScene.add.group();

    rangeGroup.clear(true, true);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      const loaded = getComponentValue(Loaded, cannonEntity);

      const rangeColor = getRangeTintAlpha(!!loaded, false);

      renderFiringArea(phaser, rangeGroup, finalPosition, finalRotation, length, cannonEntity, rangeColor);
    });

    const color = outOfBounds(finalPosition) ? colors.redHex : colors.whiteHex;

    renderShip(phaser, shipEntity, objectId, finalPosition, finalRotation, color, 0.6);

    polygonRegistry.set(objectId, rangeGroup);
  });

  defineExitSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[1] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;
    if (!hoveredMove) return;
    const objectId = `hoverGhost-${hoveredMove.shipEntity}`;

    objectPool.remove(objectId);
    polygonRegistry.get(objectId)?.clear(true, true);
  });
}
