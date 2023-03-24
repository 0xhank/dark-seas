import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";

export function targetedShipSystems(MUD: SetupResult) {
  const {
    world,
    components: { Targeted },
    utils: { getSpriteObject, getShip },
  } = MUD;

  defineComponentSystem(world, Targeted, (update) => {
    const targetedHull = getSpriteObject(`${update.entity}-hull`);
    const targetedSail = getSpriteObject(`${update.entity}-sail`);

    const value = update.value[0]?.value;
    if (!value) {
      targetedHull.clearTint();
      targetedSail.clearTint();
    } else {
      targetedHull.setTint(colors.redHex);
      targetedSail.setTint(colors.redHex);
    }
  });
}
