import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../styles/global";
import { SetupResult } from "../types";

export function targetedShipSystems(MUD: SetupResult) {
  const {
    world,
    components: { Targeted },
    utils: { getSpriteObject },
  } = MUD;

  defineComponentSystem(world, Targeted, (update) => {
    const targetedShip = getSpriteObject(update.entity);

    const value = update.value[0]?.value;
    if (!value) {
      targetedShip.clearTint();
    } else {
      targetedShip.setTint(colors.redHex);
    }
  });
}
