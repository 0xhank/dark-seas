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
      Main: { phaserScene },
    },
    components: { SelectedShip },
    polygonRegistry,
    positions,
  } = phaser;

  defineSystem(world, [Has(SelectedShip)], ({ entity, type }) => {
    if (type === UpdateType.Exit) {
      return;
    }

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const shipEntityId = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;

    let rangeGroup = polygonRegistry.get("rangeGroup");

    if (rangeGroup) rangeGroup.clear(true, true);
    else rangeGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntityId);
    const range = getComponentValueStrict(Range, shipEntityId).value;
    const length = getComponentValueStrict(Length, shipEntityId).value;
    const rotation = getComponentValueStrict(Rotation, shipEntityId).value;

    const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    const rightSidePoints = getFiringArea(
      pixelPosition,
      range * positions.posHeight,
      length * positions.posHeight,
      rotation,
      Side.Right
    );
    const leftSidePoints = getFiringArea(
      pixelPosition,
      range * positions.posHeight,
      length * positions.posHeight,
      rotation,
      Side.Left
    );
    const rightFiringRange = phaserScene.add.polygon(undefined, undefined, rightSidePoints, 0xffffff, 0.5);

    const leftFiringRange = phaserScene.add.polygon(undefined, undefined, leftSidePoints, 0xffffff, 0.5);

    rightFiringRange.setDisplayOrigin(0);
    leftFiringRange.setDisplayOrigin(0);

    rangeGroup.add(rightFiringRange, true);
    rangeGroup.add(leftFiringRange, true);

    polygonRegistry.set("rangeGroup", rangeGroup);
  });
}
