import { defineComponentSystem } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { DSTileset } from "../../phaser/assets/tilesets/dsTilesheet";
import { POS_HEIGHT, TILE_HEIGHT } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";

export function createTileSystem(MUD: SetupResult) {
  const {
    world,
    components: { GameConfig },
    utils: { isWhirlpool, inWorld },
    scene: {
      maps: { Main },
    },
    network: { clock },
  } = MUD;

  defineComponentSystem(world, GameConfig, (update) => {
    const gameConfig = update.value[0];
    const time = clock.currentTime;
    if (!gameConfig) return;

    const worldHeight = gameConfig.worldSize;
    const worldWidth = (worldHeight * 16) / 9;
    const perlinSeed = Number(gameConfig.perlinSeed);

    const adjustment = TILE_HEIGHT / POS_HEIGHT;

    for (let i = -worldWidth; i < worldWidth; i += adjustment) {
      for (let j = -worldHeight; j < worldHeight; j += adjustment) {
        const coord = { x: i, y: j };
        const adjustedCoord = { x: Math.floor(i / adjustment), y: Math.floor(j / adjustment) };
        if (!inWorld(time, coord)) continue;
        const tile = getWhirlpoolTile(coord, perlinSeed, adjustment);
        if (tile) {
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
