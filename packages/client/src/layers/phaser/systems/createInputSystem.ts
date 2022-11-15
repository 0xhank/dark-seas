import { GodID } from "@latticexyz/network";
import { pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { EntityIndex, getEntitiesWithValue, setComponent } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createInputSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { SelectedShip },
    scenes: {
      Main: {
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

  const clickSub = input.click$.subscribe((p) => {
    const pointer = p as Phaser.Input.Pointer;
    const tilePos = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, tileWidth, tileHeight);

    console.log("tile position:", tilePos);
    console.log("pixel position:", pointer.worldX, pointer.worldY);
    // const entitiesAtPosition = [...getEntitiesWithValue(Position, tilePos)];

    // if (entitiesAtPosition.length == 0) {
    //   return;
    // }

    // const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    // console.log("setting selected ship to ", entitiesAtPosition[0]);
    // setComponent(SelectedShip, GodEntityIndex, { value: entitiesAtPosition[0] });
  });

  world.registerDisposer(() => clickSub?.unsubscribe());
}
