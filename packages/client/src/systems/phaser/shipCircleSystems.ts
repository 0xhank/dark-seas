import { defineComponentSystem, defineUpdateSystem, EntityIndex, getComponentValueStrict, Has } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { HoverType } from "../../types";

export function shipCircleSystems(MUD: SetupResult) {
  const {
    world,
    components: { Position, Length, Rotation, SelectedShip, HoveredSprite },
    utils: { getGroupObject, destroyGroupObject, isMyShip, renderEllipse },
  } = MUD;

  defineComponentSystem(world, SelectedShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;

    const groupId = "select-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (shipEntity === undefined) return;

    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const shipColor = colors.whiteHex;

    renderEllipse(hoveredGroup, position, length, rotation, shipColor, 0.3);
  });

  defineComponentSystem(world, HoveredSprite, (update) => {
    if (update.entity !== HoverType.SHIP) return;
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;

    const groupId = "hover-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (shipEntity === undefined) return;
    const position = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const shipColor = colors.whiteHex;

    renderEllipse(hoveredGroup, position, length, rotation, shipColor, 0.15);
  });

  defineUpdateSystem(world, [Has(Position), Has(Rotation)], (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (shipEntity === undefined) return;
    if (!isMyShip(shipEntity)) return;
    destroyGroupObject("hover-circle");
    destroyGroupObject("select-circle");
  });
}
