import { defineComponentSystem } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { inRadius } from "../../../../utils/distance";
import { DSTileset } from "../assets/tilesets/dsTilesheet";
import { TILE_HEIGHT } from "../constants";
import { PhaserLayer } from "../types";

export function createTileSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { GameConfig },
      },
      backend: { perlin },
    },
    scenes: {
      Main: {
        maps: { Main },
      },
    },
    positions,
  } = phaser;

  defineComponentSystem(world, GameConfig, (update) => {
    const gameConfig = update.value[0];
    // const worldRadius = 10;
    if (!gameConfig) return;

    const worldRadius = gameConfig.worldRadius;
    const startTime = Number(gameConfig.startTime);
    console.log("world radius:", worldRadius);

    const adjustment = TILE_HEIGHT / positions.posHeight;

    for (let i = -worldRadius; i < worldRadius; i++) {
      for (let j = -worldRadius; j < worldRadius; j++) {
        const coord = { x: i, y: j };
        const adjustedCoord = { x: Math.floor(i / adjustment), y: Math.floor(j / adjustment) };
        if (isWhirlpool(coord, startTime) && inRadius(coord, worldRadius)) {
          // console.log("placing whirlpool at,", coord.x, coord.y);
          Main.putTileAt(adjustedCoord, DSTileset.Blank, "Foreground");

          continue;
        }
      }
    }
  });

  function isWhirlpool(coord: Coord, startTime: number): boolean {
    const denom = 40;
    let depth = perlin(coord.x, coord.y, 0, denom);
    depth = depth * 100;

    return depth < 26;
  }
}
