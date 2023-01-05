import { defineSystem, Has } from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";

export function createTargetedSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      backend: {
        components: { Targeted },
      },
    },
    scenes: {
      Main: { objectPool },
    },
  } = phaser;

  defineSystem(world, [Has(Targeted)], (update) => {
    const targetedShip = objectPool.get(`${update.entity}`, "Sprite");

    const value = update.value[0]?.value;

    if (!value) {
      targetedShip.removeComponent("tint");
    } else {
      targetedShip.setComponent({
        id: "tint",
        once: (sprite) => {
          sprite.setTint(colors.redHex);
        },
      });
    }
  });
}
