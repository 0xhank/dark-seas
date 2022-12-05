import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  Has,
  removeComponent,
  UpdateType,
} from "@latticexyz/recs";
import { Phase, Side, Sprites } from "../../../constants";
import { getFinalPosition } from "../../../utils/directions";
import { getShipSprite } from "../../../utils/ships";
import { getFiringArea } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createProjectionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Wind, Position, Range, Length, Rotation, SailPosition, MoveCard, Health },
    utils: { getCurrentGamePhase },
  } = network;

  const {
    scenes: {
      Main: { objectPool, phaserScene, config },
    },
    components: { SelectedShip, SelectedMove },
    polygonRegistry,
    positions,
  } = phaser;

  defineExitSystem(world, [Has(SelectedMove)], ({ entity }) => {
    removeComponent(SelectedMove, entity);
    const rangeGroup = polygonRegistry.get("rangeGroup");
    if (rangeGroup) rangeGroup.clear(true, true);

    objectPool.remove(`projection-${entity}`);
  });

  defineSystem(world, [Has(SelectedMove), Has(Health)], ({ entity, type }) => {
    const currentGamePhase: Phase | undefined = getCurrentGamePhase();

    if (currentGamePhase == undefined || currentGamePhase == Phase.Action) return;

    if (type == UpdateType.Exit) return;
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const shipEntityId = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;
    const moveCardEntity = getComponentValue(SelectedMove, entity);

    let rangeGroup = polygonRegistry.get("rangeGroup");
    const object = objectPool.get(`projection-${entity}`, "Sprite");

    if (rangeGroup) rangeGroup.clear(true, true);
    if (!moveCardEntity) return;
    if (!rangeGroup) rangeGroup = phaserScene.add.group();

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntityId);
    const range = getComponentValueStrict(Range, shipEntityId).value;
    const length = getComponentValueStrict(Length, shipEntityId).value;
    const rotation = getComponentValueStrict(Rotation, shipEntityId).value;
    const wind = getComponentValueStrict(Wind, GodEntityIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntityId).value;
    const health = getComponentValueStrict(Health, shipEntityId).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);

    const pixelPosition = tileCoordToPixelCoord(finalPosition, positions.posWidth, positions.posHeight);

    const rightSidePoints = getFiringArea(
      pixelPosition,
      range * positions.posHeight,
      length * positions.posHeight,
      finalRotation,
      Side.Right
    );
    const leftSidePoints = getFiringArea(
      pixelPosition,
      range * positions.posHeight,
      length * positions.posHeight,
      finalRotation,
      Side.Left
    );
    const rightFiringRange = phaserScene.add.polygon(undefined, undefined, rightSidePoints, 0xffffff, 0.3);

    const leftFiringRange = phaserScene.add.polygon(undefined, undefined, leftSidePoints, 0xffffff, 0.3);

    rightFiringRange.setDisplayOrigin(0);
    leftFiringRange.setDisplayOrigin(0);

    rightFiringRange.setZ(1000);
    leftFiringRange.setZ(1000);

    rangeGroup.add(rightFiringRange, true);
    rangeGroup.add(leftFiringRange, true);

    polygonRegistry.set("rangeGroup", rangeGroup);

    const spriteAsset: Sprites = getShipSprite(GodEntityIndex, GodEntityIndex, health);
    const sprite = config.sprites[spriteAsset];

    const { x, y } = tileCoordToPixelCoord(finalPosition, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: Position.id,
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle((finalRotation - 90) % 360);
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        gameObject.setOrigin(0.5, 0.92);
        gameObject.setDisplaySize(shipWidth, shipLength);
        gameObject.setPosition(x, y);
        gameObject.setAlpha(0.3);
        gameObject.setZ(1001);
      },
    });
  });
}
