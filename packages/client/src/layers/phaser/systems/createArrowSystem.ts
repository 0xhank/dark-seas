import { GodID } from "@latticexyz/network";
import { HueTintAndOutlineFXPipeline, pixelCoordToTileCoord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { defineSystem, EntityIndex, getEntitiesWithValue, Has, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createArrowSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { SelectedShip, SelectedMove },
    scenes: {
      Main: {
        objectPool,
        input,

        maps: {
          Main: { tileWidth, tileHeight },
        },
      },
    },
  } = phaser;

  const {
    components: { Position },
  } = network;

  defineSystem(world, [Has(SelectedMove), Has(SelectedShip)], ({ entity, value }) => {
    const arrow = objectPool.get(`${entity}-hover-highlight`, "Rectangle");

    const data = [0, 20, 84, 20, 84, 0, 120, 50, 84, 100, 84, 80, 0, 80];

    arrow.setComponent({
      id: "arrow",
      once: (arrow) => {
        const pixelCoord = tileCoordToPixelCoord({ x: 0, y: 0 }, tileWidth, tileHeight);

        arrow.setSize(tileWidth, tileHeight);
        arrow.setPosition(pixelCoord.x, pixelCoord.y);
        // arrow.set
        arrow.setDepth(12);

        arrow.setPipeline(HueTintAndOutlineFXPipeline.KEY);
        // arrow.setPipelineData("hueTint", hoverHighlght.color);
      },
    });
  });
}
