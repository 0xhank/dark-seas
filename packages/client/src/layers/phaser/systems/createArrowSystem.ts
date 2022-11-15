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
        phaserScene,
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

  // const data = [0, 20, 84, 20, 84, 0, 120, 50, 84, 100, 84, 80, 0, 80];

  // // const arrows = phaserScene.add.group();

  // // defineSystem(world, [Has(Position)], ({ entity, value }) => {
  // console.log("made it here");
  // const pixelCoord = tileCoordToPixelCoord({ x: 0, y: 0 }, tileWidth, tileHeight);

  // const arrow = phaserScene.add.polygon(pixelCoord.x, pixelCoord.y, data, 0xff0000);
  // arrow.setData("directional arrow");
  // // const arrow = phaserScene.add.rectangle(pixelCoord.x, pixelCoord.y, 10, 10, 0xff0000);
  // arrow.setDepth(9999);

  // arrows.add(arrow, true);

  // arrow.setPipelineData("hueTint", hoverHighlght.color);
  // });
}
