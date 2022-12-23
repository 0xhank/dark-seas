import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { PhaserLayer } from "../types";
import { registerCameraControls } from "./registerCameraControls";

export function createInputSystem(phaser: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: {
        input,
        maps: {
          Main: { tileWidth, tileHeight },
        },
      },
    },
  } = phaser;

  const clickSub = input.click$.subscribe((p) => {
    const pointer = p as Phaser.Input.Pointer;
    const tilePos = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, tileWidth, tileHeight);

    // console.log("tile position:", tilePos);
    // console.log("pixel position:", pointer.worldX, pointer.worldY);
  });

  world.registerDisposer(() => clickSub?.unsubscribe());

  registerCameraControls(phaser);
}
