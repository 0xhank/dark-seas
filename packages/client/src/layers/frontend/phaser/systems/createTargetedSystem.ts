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
    console.log("targeting:", update);
    const targetedShip = objectPool.get(`${update.entity}`, "Sprite");

    const value = update.value[0]?.value;

    const hasTint = targetedShip.hasComponent("tint");
    if (!value && hasTint) {
      targetedShip.removeComponent("tint");
    } else if (!hasTint) {
      targetedShip.setComponent({
        id: "tint",
        once: (sprite) => {
          sprite.setTint(colors.redHex);
        },
      });
    }
  });
}
