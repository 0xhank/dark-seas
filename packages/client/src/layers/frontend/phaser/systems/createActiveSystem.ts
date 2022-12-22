import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { defineSystem, EntityIndex, getComponentValueStrict, Has, UpdateType } from "@latticexyz/recs";
import { Phase, Side } from "../../../../types";
import { getWindBoost } from "../../../../utils/directions";
import { getFiringArea } from "../../../../utils/trig";
import { DELAY } from "../../constants";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createActiveSystem(layer: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, Wind, Range },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedShip },
      },
    },
    polygonRegistry,
    positions,
    scenes: {
      Main: { phaserScene },
    },
  } = layer;

  defineSystem(world, [Has(SelectedShip), Has(Wind)], ({ type }) => {
    const phase: Phase | undefined = getPhase(DELAY);

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
    circle.setDepth(RenderDepth.Foreground5);

    if (phase == Phase.Action) {
      const position = getComponentValueStrict(Position, shipEntityId);
      const range = getComponentValueStrict(Range, shipEntityId).value;
      const length = getComponentValueStrict(Length, shipEntityId).value;
      const rotation = getComponentValueStrict(Rotation, shipEntityId).value;

      const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);
      const forwardSidePoints = getFiringArea(
        pixelPosition,
        range * positions.posHeight,
        length * positions.posHeight,
        rotation,
        Side.Forward
      );

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
      const forwardFiringRange = phaserScene.add.polygon(undefined, undefined, forwardSidePoints, 0xffffff, 0.1);
      const rightFiringRange = phaserScene.add.polygon(undefined, undefined, rightSidePoints, 0xffffff, 0.1);
      const leftFiringRange = phaserScene.add.polygon(undefined, undefined, leftSidePoints, 0xffffff, 0.1);

      forwardFiringRange.setDisplayOrigin(0);
      rightFiringRange.setDisplayOrigin(0);
      leftFiringRange.setDisplayOrigin(0);

      forwardFiringRange.setDepth(RenderDepth.Foreground5);
      rightFiringRange.setDepth(RenderDepth.Foreground5);
      leftFiringRange.setDepth(RenderDepth.Foreground5);

      activeGroup.add(forwardFiringRange, true);
      activeGroup.add(rightFiringRange, true);
      activeGroup.add(leftFiringRange, true);
    }

    activeGroup.add(circle, true);

    polygonRegistry.set("activeGroup", activeGroup);
  });
}
