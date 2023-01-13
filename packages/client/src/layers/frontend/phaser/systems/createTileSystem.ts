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
      backend: {
        utils: { isWhirlpool },
      },
    },
    scenes: {
      Main: {
        maps: { Main },
      },
    },
    positions,
  } = phaser;

  const whirlpoolMap = new Map<string, boolean>();

  defineComponentSystem(world, GameConfig, (update) => {
    const gameConfig = update.value[0];
    // const worldRadius = 10;
    if (!gameConfig) return;

    const worldRadius = gameConfig.worldRadius;
    const perlinSeed = Number(gameConfig.perlinSeed);

    const adjustment = TILE_HEIGHT / positions.posHeight;

    for (let i = -worldRadius; i < worldRadius; i += adjustment) {
      for (let j = -worldRadius; j < worldRadius; j += adjustment) {
        const coord = { x: i, y: j };
        const adjustedCoord = { x: Math.floor(i / adjustment), y: Math.floor(j / adjustment) };
        if (!inRadius(coord, worldRadius)) continue;
        const tile = getWhirlpoolTile(coord, perlinSeed, adjustment);
        if (tile) {
          // console.log("placing whirlpool at,", coord.x, coord.y);
          Main.putTileAt(adjustedCoord, tile, "Foreground");

          continue;
        }
      }
    }
  });

  function getWhirlpoolTile(coord: Coord, perlinSeed: number, adjustment: number): DSTileset | undefined {
    const whirlpool = isWhirlpool(coord, perlinSeed);
    if (!whirlpool) return;
    const above = { x: coord.x, y: coord.y - adjustment };
    const below = { x: coord.x, y: coord.y + adjustment };
    const right = { x: coord.x + adjustment, y: coord.y };
    const left = { x: coord.x - adjustment, y: coord.y };

    const abovePool = isWhirlpool(above, perlinSeed);
    const belowPool = isWhirlpool(below, perlinSeed);
    const rightPool = isWhirlpool(right, perlinSeed);
    const leftPool = isWhirlpool(left, perlinSeed);
    const numPools = [abovePool, belowPool, rightPool, leftPool].filter((i) => i).length;
    if (numPools < 2) return DSTileset.Rock;
    if (numPools == 4) return DSTileset.Middle;
    if (numPools == 3) {
      if (abovePool && belowPool && rightPool) return DSTileset.Left;
      if (abovePool && belowPool && leftPool) return DSTileset.Right;
      if (abovePool && leftPool && rightPool) return DSTileset.Bottom;
      if (belowPool && leftPool && rightPool) return DSTileset.Top;
    }
    if (numPools == 2) {
      if (abovePool && belowPool) return DSTileset.Rock;
      if (leftPool && rightPool) return DSTileset.Rock;
      if (abovePool && rightPool) return DSTileset.BottomLeft;
      if (abovePool && leftPool) return DSTileset.BottomRight;
      if (belowPool && rightPool) return DSTileset.TopLeft;
      if (belowPool && leftPool) return DSTileset.TopRight;
    }
  }
}
