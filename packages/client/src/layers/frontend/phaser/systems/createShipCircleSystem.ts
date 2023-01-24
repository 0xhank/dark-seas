import { defineComponentSystem, defineUpdateSystem, EntityIndex, getComponentValueStrict, Has } from "@latticexyz/recs";
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
      },
    },
    utils: { getGroupObject, destroyGroupObject },
  } = phaser;

  defineComponentSystem(world, SelectedShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;

    const groupId = "hover-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (shipEntity === undefined) return;

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const shipColor = colors.whiteHex;

    renderCircle(phaser, hoveredGroup, position, length, rotation, shipColor, 0.3);
  });

  defineComponentSystem(world, HoveredShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;

    const groupId = "select-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (shipEntity === undefined) return;
    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const shipColor = colors.whiteHex;

    renderCircle(phaser, hoveredGroup, position, length, rotation, shipColor, 0.15);
  });

  defineUpdateSystem(world, [Has(Position), Has(Rotation)], (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (shipEntity === undefined) return;
    if (!isMyShip(shipEntity)) return;
    destroyGroupObject("hover-circle");
    destroyGroupObject("select-circle");
  });
}
