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
    components: { Health, Position },
  } = network;

  const {
    scenes: {
      Main: {
        objectPool,
        config,
        maps: {
          Main: { tileWidth, tileHeight },
        },
      },
    },
    components: { SelectedShip },
    polygonRegistry,
  } = phaser;

  defineUpdateSystem(world, [Has(Health)], (update) => {
    const object = objectPool.get(update.entity, "Rectangle");

    object.setComponent({
      id: "flash-red",
      now: (sprite) => {
        sprite.setFillStyle(0xff0000);

        setTimeout(() => sprite.setFillStyle(0xe97451), 500);
      },
    });
  });
}
