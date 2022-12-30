import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
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
import { Phase, Sprites } from "../../../../types";
import { getFinalPosition } from "../../../../utils/directions";
import { getShipSprite } from "../../../../utils/ships";
import { getFiringArea } from "../../../../utils/trig";
import { DELAY } from "../../constants";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

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
      Main: { objectPool, phaserScene, config },
    },
    polygonRegistry,
    positions,
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

    let rangeGroup = polygonRegistry.get(`rangeGroup-${shipEntity}`);
    const object = objectPool.get(`projection-${shipEntity}`, "Sprite");

    if (rangeGroup) rangeGroup.clear(true, true);
    if (!moveCardEntity) return;
    if (!rangeGroup) rangeGroup = phaserScene.add.group();

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const wind = getComponentValueStrict(Wind, GodEntityIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const health = getComponentValueStrict(Health, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    const pixelPosition = tileCoordToPixelCoord(finalPosition, positions.posWidth, positions.posHeight);

    const firingPolygons = cannonEntities.map((cannonEntity) => {
      const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;
      const range = getComponentValueStrict(Range, cannonEntity).value;

      const firingArea = getFiringArea(
        pixelPosition,
        range * positions.posHeight,
        length * positions.posHeight,
        finalRotation,
        cannonRotation
      );

      const firingPolygon = phaserScene.add.polygon(undefined, undefined, firingArea, 0xffffff, 0.1);
      firingPolygon.setDisplayOrigin(0);
      firingPolygon.setDepth(RenderDepth.Foreground5);

      return firingPolygon;
    });

    rangeGroup.addMultiple(firingPolygons, true);

    polygonRegistry.set(`rangeGroup-${shipEntity}`, rangeGroup);

    const spriteAsset: Sprites = getShipSprite(GodEntityIndex, health, true);
    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];

    const { x, y } = tileCoordToPixelCoord(finalPosition, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: `projection-${shipEntity}`,
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle((finalRotation - 90) % 360);
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        gameObject.setOrigin(0.5, 0.92);
        gameObject.setDisplaySize(shipWidth, shipLength);
        gameObject.setPosition(x, y);
        gameObject.setAlpha(0.3);
        gameObject.setDepth(RenderDepth.Foreground5);
      },
    });
  });
}
