import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";

export function createTargetedSystem(phaser: PhaserLayer) {
  const {
    world,
    components: { Targeted },

    utils: { getSpriteObject },
  } = phaser;

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
