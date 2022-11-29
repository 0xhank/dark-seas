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
import { getWindBoost } from "../../../utils/directions";
import { getFiringArea } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createActiveSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Length, Rotation, Wind },
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

    const windBoost = getWindBoost(wind.speed, wind.direction, rotation);

    const color = windBoost > 0 ? 0xa3ffa9 : windBoost < 0 ? 0xffa3a3 : 0xffffff;
    const circle = phaserScene.add.ellipse(pixelPosition.x, pixelPosition.y, circleWidth, circleHeight, color, 0.5);

    circle.setAngle(rotation % 360);
    circle.setOrigin(0.85, 0.5);
    activeGroup.add(circle, true);

    polygonRegistry.set("activeGroup", activeGroup);
  });
}
