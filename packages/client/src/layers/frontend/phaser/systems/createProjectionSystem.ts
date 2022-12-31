import { GodID } from "@latticexyz/network";
import {
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
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
        components: { SelectedMove },
      },
    },
    scenes: {
      Main: { objectPool, phaserScene },
    },
    polygonRegistry,
  } = phaser;

  defineExitSystem(world, [Has(SelectedMove)], ({ entity: shipEntity }) => {
    removeComponent(SelectedMove, shipEntity);
    const rangeGroup = polygonRegistry.get(`rangeGroup-${shipEntity}`);
    if (rangeGroup) rangeGroup.clear(true, true);

    objectPool.remove(`projection-${shipEntity}`);
  });

  defineSystem(world, [Has(SelectedMove), Has(Health)], ({ entity: shipEntity, type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

    if (phase == undefined || phase == Phase.Action) return;

    if (type == UpdateType.Exit) return;
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const moveCardEntity = getComponentValue(SelectedMove, shipEntity);
    const objectId = `rangeGroup-${shipEntity}`;
    const rangeGroup = polygonRegistry.get(objectId) || phaserScene.add.group();

    rangeGroup.clear(true, true);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value;
    const wind = getComponentValueStrict(Wind, GodEntityIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      renderFiringArea(phaser, rangeGroup, finalPosition, finalRotation, length, cannonEntity, 0xffffff, 0.3);
    });
    polygonRegistry.set(objectId, rangeGroup);

    renderShip(phaser, shipEntity, `projection-${shipEntity}`, finalPosition, finalRotation, 0xffffff, 0.3);
  });
}
