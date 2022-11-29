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
import { Side } from "../../../constants";
import { getFinalPosition } from "../../../utils/directions";
import { getFiringArea } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { SHIP_RATIO, Sprites } from "../constants";
import { PhaserLayer } from "../types";

export function createProjectionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Wind, Position, Range, Length, Rotation, SailPosition, MoveCard },
  } = network;

  const {
    scenes: {
      Main: { objectPool, phaserScene, config },
    },
    components: { SelectedShip, SelectedMove },
    polygonRegistry,
    positions,
  } = phaser;

  defineExitSystem(world, [Has(SelectedShip)], ({ entity }) => {
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);
    removeComponent(SelectedMove, GodEntityIndex);
    const rangeGroup = polygonRegistry.get("rangeGroup");
    if (rangeGroup) rangeGroup.clear(true, true);

    objectPool.remove("projection");
  });

  defineSystem(world, [Has(SelectedShip), Has(SelectedMove), Has(Wind)], ({ entity, type }) => {
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const shipEntityId = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;
    const moveCardEntity = getComponentValue(SelectedMove, GodEntityIndex);

    let rangeGroup = polygonRegistry.get("rangeGroup");
    const object = objectPool.get("projection", "Sprite");

    if (rangeGroup) rangeGroup.clear(true, true);

    if (type === UpdateType.Exit || !moveCardEntity) {
      objectPool.remove("projection");
      return;
    }

    if (!rangeGroup) rangeGroup = phaserScene.add.group();

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntityId);
    const range = getComponentValueStrict(Range, shipEntityId).value;
    const length = getComponentValueStrict(Length, shipEntityId).value;
    const rotation = getComponentValueStrict(Rotation, shipEntityId).value;
    const wind = getComponentValueStrict(Wind, GodEntityIndex);
    const sailPosition = getComponentValueStrict(SailPosition, shipEntityId).value;

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

    rangeGroup.add(rightFiringRange, true);
    rangeGroup.add(leftFiringRange, true);

    polygonRegistry.set("rangeGroup", rangeGroup);

    const sprite = config.sprites[Sprites.ShipBlack];
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
      },
    });
  });
}
