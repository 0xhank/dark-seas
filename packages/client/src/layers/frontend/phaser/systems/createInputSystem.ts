import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { removeComponent } from "@latticexyz/recs";
import { PhaserLayer } from "../types";
import { registerCameraControls } from "./registerCameraControls";

export function createInputSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      backend: {
        godIndex,
        components: { SelectedShip },
      },
    },
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

    console.log("tile position:", tilePos);
    console.log("pixel position:", pointer.worldX, pointer.worldY);
  });

  input.onKeyPress(
    (keys) => keys.has("ESC"),
    () => {
      removeComponent(SelectedShip, godIndex);
    }
  );

  world.registerDisposer(() => clickSub?.unsubscribe());

  registerCameraControls(phaser);
}
