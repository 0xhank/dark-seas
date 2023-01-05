import { defineComponentSystem, EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
import { getColorNum } from "../../../../utils/procgen";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderCircle } from "./renderShip";
export function createShipCircleSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Length, Rotation },
      },
      backend: {
        utils: { isMyShip },
        components: { SelectedShip, HoveredShip },
        godIndex,
      },
    },
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
  } = phaser;

  defineComponentSystem(world, SelectedShip, (update) => {
    const groupId = "circle";
    let hoveredGroup = polygonRegistry.get(groupId);
    if (hoveredGroup) hoveredGroup.clear(true, true);

    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (shipEntity === undefined) return;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const shipColor = isMyShip(shipEntity) ? getColorNum(shipEntity) : colors.whiteHex;
    renderCircle(phaser, hoveredGroup, position, length, rotation, shipColor, 0.5);

    polygonRegistry.set(groupId, hoveredGroup);
  });

  defineComponentSystem(world, HoveredShip, (update) => {
    const groupId = "hover-circle";
    let hoveredGroup = polygonRegistry.get(groupId);
    if (hoveredGroup) hoveredGroup.clear(true, true);
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (shipEntity === undefined) return;

    if (!hoveredGroup) hoveredGroup = phaserScene.add.group();

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;

    renderCircle(phaser, hoveredGroup, position, length, rotation, colors.whiteHex, 0.3);

    polygonRegistry.set(groupId, hoveredGroup);
  });
}
