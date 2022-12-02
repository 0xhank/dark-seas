import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineSystem,
  defineUpdateSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { deg2rad } from "../../../utils/trig";
import { NetworkLayer } from "../../network";
import { Sprites } from "../constants";
import { PhaserLayer } from "../types";

const shipWidth = 2;

export function createHealthSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Health },
  } = network;

  const { objectPool } = phaser.scenes.Main;

  defineUpdateSystem(world, [Has(Health)], (update) => {
    const object = objectPool.get(update.entity, "Sprite");

    object.setComponent({
      id: "flash-red",
      now: (sprite) => {
        sprite.setTint(0xff0000);

        setTimeout(() => sprite.clearTint());
      },
    });
  });
}
