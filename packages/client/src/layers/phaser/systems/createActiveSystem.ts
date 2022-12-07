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
import { Phase, Side } from "../../../constants";
import { getWindBoost } from "../../../utils/directions";
import { getFiringArea } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createActiveSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Length, Rotation, Wind, Range },
    utils: { getPhase },
  } = network;

  const {
    scenes: {
      Main: { phaserScene },
    },
    components: { SelectedShip },
    polygonRegistry,
    positions,
  } = phaser;

  defineSystem(world, [Has(SelectedShip), Has(Wind)], ({ type }) => {
    const phase: Phase | undefined = getPhase();

    if (phase == undefined) return;

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    let activeGroup = polygonRegistry.get("activeGroup");
    if (activeGroup) activeGroup.clear(true, true);

    if (type === UpdateType.Exit) {
      return;
    }

    const shipEntityId = getComponentValueStrict(SelectedShip, GodEntityIndex).value as EntityIndex;
    const wind = getComponentValueStrict(Wind, GodEntityIndex);

    if (!activeGroup) activeGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntityId);
    const length = getComponentValueStrict(Length, shipEntityId).value;
    const rotation = getComponentValueStrict(Rotation, shipEntityId).value;

    const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    const circleWidth = length * positions.posWidth * 1.5;
    const circleHeight = circleWidth / SHIP_RATIO;

    const windBoost = getWindBoost(wind, rotation);

    const color = phase == Phase.Commit ? (windBoost > 0 ? 0xa3ffa9 : windBoost < 0 ? 0xffa3a3 : 0xffffff) : 0xffffff;
    const circle = phaserScene.add.ellipse(pixelPosition.x, pixelPosition.y, circleWidth, circleHeight, color, 0.5);

    circle.setAngle(rotation % 360);
    circle.setOrigin(0.85, 0.5);

    if (phase == Phase.Action) {
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

      const rightFiringRange = phaserScene.add.polygon(undefined, undefined, rightSidePoints, 0xffffff, 0.3);

      const leftFiringRange = phaserScene.add.polygon(undefined, undefined, leftSidePoints, 0xffffff, 0.3);

      rightFiringRange.setDisplayOrigin(0);
      leftFiringRange.setDisplayOrigin(0);
      activeGroup.add(rightFiringRange, true);
      activeGroup.add(leftFiringRange, true);
    }

    activeGroup.add(circle, true);

    polygonRegistry.set("activeGroup", activeGroup);
  });
}
