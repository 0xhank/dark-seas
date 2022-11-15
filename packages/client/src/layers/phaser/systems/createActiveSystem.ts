import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineSystem,
  EntityIndex,
  getComponentValueStrict,
  getEntitiesWithValue,
  Has,
  UpdateType,
} from "@latticexyz/recs";
import { Side } from "../../../constants";
import { coordToArray } from "../../../utils/coords";
import { getFiringArea } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createActiveSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Ship, Position, Range, Length, Rotation },
  } = network;

  const {
    scenes: {
      Main: {
        objectPool,
        phaserScene,
        maps: {
          Main: { tileWidth, tileHeight },
        },
      },
    },
    components: { SelectedShip },
    polygonRegistry,
  } = phaser;

  defineSystem(world, [Has(SelectedShip)], ({ entity, type }) => {
    console.log("in create active system");
    if (type === UpdateType.Exit) {
      return;
    }

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const shipEntityId = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;

    const ships = [...getEntitiesWithValue(Ship, { value: true })];

    ships.map((ship) =>
      objectPool.get(ship, "Rectangle").setComponent({
        id: SelectedShip.id,

        once: async (gameObject) => {
          gameObject.setFillStyle(0xffff00, 1);
        },
      })
    );

    let rangeGroup = polygonRegistry.get("rangeGroup");

    if (rangeGroup) rangeGroup.clear(true, true);
    else rangeGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntityId);
    const range = getComponentValueStrict(Range, shipEntityId);
    const length = getComponentValueStrict(Length, shipEntityId);
    const rotation = getComponentValueStrict(Rotation, shipEntityId);

    const pixelPosition = tileCoordToPixelCoord(position, tileWidth, tileHeight);

    const rightSidePoints = getFiringArea(
      pixelPosition,
      range.value * tileHeight,
      length.value * tileHeight,
      rotation.value,
      Side.Right
    );
    const leftSidePoints = getFiringArea(
      pixelPosition,
      range.value * tileHeight,
      length.value * tileHeight,
      rotation.value,
      Side.Left
    );

    const rightSideArray = rightSidePoints.map((coord) => coordToArray(coord)).flat();
    const leftSideArray = leftSidePoints.map((coord) => coordToArray(coord)).flat();

    // console.log("rightSideArray:", rightSideArray);
    // console.log("leftSideArray:", leftSideArray);

    const rightFiringRange = phaserScene.add.polygon(pixelPosition.x, pixelPosition.y, rightSideArray, 0xfffff, 0.5);
    const leftFiringRange = phaserScene.add.polygon(pixelPosition.x, pixelPosition.y, leftSideArray, 0xfffff, 0.5);

    rightFiringRange.setOrigin(0, 0);
    leftFiringRange.setOrigin(0, 0);

    rangeGroup.add(rightFiringRange, true);
    rangeGroup.add(leftFiringRange, true);

    polygonRegistry.set("rangeGroup", rangeGroup);

    const object = objectPool.get(shipEntityId, "Rectangle");
    object.setComponent({
      id: SelectedShip.id,

      once: async (gameObject) => {
        gameObject.setFillStyle(0xff0000, 1);
      },
    });
  });
}
