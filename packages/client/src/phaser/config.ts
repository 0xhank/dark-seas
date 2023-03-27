import {
  AssetType,
  defineCameraConfig,
  defineMapConfig,
  defineScaleConfig,
  defineSceneConfig,
} from "@latticexyz/phaserx";
import { Sprites } from "../types";
import dsTileset from "./assets/tilesets/ds-tilesheet.png";
import { DSTileset } from "./assets/tilesets/dsTilesheet";
import { Animations, Assets, Maps, Scenes, TILE_HEIGHT, TILE_WIDTH } from "./constants";
const ANIMATION_INTERVAL = 200;
export const sprites: Record<Sprites, { assetKey: string; frame: string }> = {
  [Sprites.Cannon]: {
    assetKey: Assets.MainAtlas,
    frame: "cannon.png",
  },
  [Sprites.Cannonball]: {
    assetKey: Assets.MainAtlas,
    frame: "cannonBall.png",
  },
  [Sprites.DeadMan]: {
    assetKey: Assets.MainAtlas,
    frame: "crew.png",
  },
  [Sprites.SailGreen]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeGreen.png",
  },
  [Sprites.SailGreenDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeGreenDead.png",
  },
  [Sprites.SailGreenMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeGreenMajor.png",
  },
  [Sprites.SailGreenMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeGreenMinor.png",
  },
  [Sprites.SailSmallGreen]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallGreen.png",
  },
  [Sprites.SailSmallGreenDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallGreenDead.png",
  },
  [Sprites.SailSmallGreenMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallGreenMajor.png",
  },
  [Sprites.SailSmallGreenMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallGreenMinor.png",
  },
  [Sprites.SailWhite]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeWhite.png",
  },
  [Sprites.SailWhiteDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeWhiteDead.png",
  },
  [Sprites.SailWhiteMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeWhiteMajor.png",
  },
  [Sprites.SailWhiteMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeWhiteMinor.png",
  },
  [Sprites.SailSmallWhite]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallWhite.png",
  },
  [Sprites.SailSmallWhiteDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallWhiteDead.png",
  },
  [Sprites.SailSmallWhiteMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallWhiteMajor.png",
  },
  [Sprites.SailSmallWhiteMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallWhiteMinor.png",
  },

  [Sprites.SailBlue]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlue.png",
  },
  [Sprites.SailBlueDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlueDead.png",
  },
  [Sprites.SailBlueMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlueMajor.png",
  },
  [Sprites.SailBlueMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlueMinor.png",
  },
  [Sprites.SailSmallBlue]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlue.png",
  },
  [Sprites.SailSmallBlueDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlueDead.png",
  },
  [Sprites.SailSmallBlueMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlueMajor.png",
  },
  [Sprites.SailSmallBlueMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlueMinor.png",
  },
  [Sprites.SailBlack]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlack.png",
  },
  [Sprites.SailBlackDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlackDead.png",
  },
  [Sprites.SailBlackMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlackMajor.png",
  },
  [Sprites.SailBlackMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeBlackMinor.png",
  },
  [Sprites.SailSmallBlack]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlack.png",
  },
  [Sprites.SailSmallBlackDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlackDead.png",
  },
  [Sprites.SailSmallBlackMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlackMajor.png",
  },
  [Sprites.SailSmallBlackMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallBlackMinor.png",
  },
  [Sprites.SailYellow]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellow.png",
  },
  [Sprites.SailYellowDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowDead.png",
  },
  [Sprites.SailYellowMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowMajor.png",
  },
  [Sprites.SailYellowMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowMinor.png",
  },
  [Sprites.SailSmallYellow]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellow.png",
  },
  [Sprites.SailSmallYellowDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowDead.png",
  },
  [Sprites.SailSmallYellowMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowMajor.png",
  },
  [Sprites.SailSmallYellowMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailSmallYellowMinor.png",
  },

  [Sprites.SailRed]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRed.png",
  },
  [Sprites.SailRedDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedDead.png",
  },
  [Sprites.SailRedMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedMajor.png",
  },
  [Sprites.SailRedMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedMinor.png",
  },
  [Sprites.SailSmallRed]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRed.png",
  },
  [Sprites.SailSmallRedDead]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedDead.png",
  },
  [Sprites.SailSmallRedMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedMajor.png",
  },
  [Sprites.SailSmallRedMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "sailLargeRedMinor.png",
  },
  [Sprites.HullSmall]: {
    assetKey: Assets.MainAtlas,
    frame: "hullSmall.png",
  },
  [Sprites.HullSmallMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "hullSmallMinor.png",
  },
  [Sprites.HullSmallMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "hullSmallMajor.png",
  },
  [Sprites.HullSmallDead]: {
    assetKey: Assets.MainAtlas,
    frame: "hullSmallDead.png",
  },
  [Sprites.HullLarge]: {
    assetKey: Assets.MainAtlas,
    frame: "hullLarge.png",
  },
  [Sprites.HullLargeMinor]: {
    assetKey: Assets.MainAtlas,
    frame: "hullLargeMinor.png",
  },
  [Sprites.HullLargeMajor]: {
    assetKey: Assets.MainAtlas,
    frame: "hullLargeMajor.png",
  },
  [Sprites.HullLargeDead]: {
    assetKey: Assets.MainAtlas,
    frame: "hullLargeDead.png",
  },
  [Sprites.CrowsNest]: {
    assetKey: Assets.MainAtlas,
    frame: "nest.png",
  },
  [Sprites.HealthCrate1]: {
    assetKey: Assets.Crates,
    frame: "health.png",
  },
  [Sprites.HealthCrate2]: {
    assetKey: Assets.Crates,
    frame: "health2.png",
  },
  [Sprites.SpeedCrate1]: {
    assetKey: Assets.Crates,
    frame: "speed.png",
  },
  [Sprites.SpeedCrate2]: {
    assetKey: Assets.Crates,
    frame: "speed2.png",
  },
  [Sprites.FirepowerCrate1]: {
    assetKey: Assets.Crates,
    frame: "firepower.png",
  },
  [Sprites.FirepowerCrate2]: {
    assetKey: Assets.Crates,
    frame: "firepower2.png",
  },
  [Sprites.SizeCrate1]: {
    assetKey: Assets.Crates,
    frame: "size.png",
  },
  [Sprites.SizeCrate2]: {
    assetKey: Assets.Crates,
    frame: "size2.png",
  },
  [Sprites.Explosion1]: {
    assetKey: "none",
    frame: "none",
  },
  [Sprites.Explosion2]: {
    assetKey: "none",
    frame: "none",
  },
  [Sprites.Explosion3]: {
    assetKey: "none",
    frame: "none",
  },
  [Sprites.Fire2]: {
    assetKey: "none",
    frame: "none",
  },
  [Sprites.Fire1]: {
    assetKey: "none",
    frame: "none",
  },
};
export const phaserConfig = {
  sceneConfig: {
    [Scenes.Main]: defineSceneConfig({
      assets: {
        [Assets.DSTileset]: { type: AssetType.Image, key: Assets.DSTileset, path: dsTileset },
        [Assets.MainAtlas]: {
          type: AssetType.MultiAtlas,
          key: Assets.MainAtlas,
          path: "/atlases/sprites/atlas.json",
          options: {
            imagePath: "/atlases/sprites/",
          },
        },
        [Assets.Crates]: {
          type: AssetType.MultiAtlas,
          key: Assets.Crates,
          path: "/atlases/sprites/crate-spritesheet.json",
          options: {
            imagePath: "/atlases/sprites/",
          },
        },
      },
      maps: {
        [Maps.Main]: defineMapConfig({
          chunkSize: TILE_WIDTH * 64, // tile size * tile amount
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          backgroundTile: [DSTileset.Water],
          animationInterval: ANIMATION_INTERVAL,
          // tileAnimations: OverworldTileAnimations,
          layers: {
            layers: {
              Background: { tilesets: ["Default"], hasHueTintShader: true },
              Foreground: { tilesets: ["Default"], hasHueTintShader: true },
            },
            defaultLayer: "Background",
          },
        }),
      },
      sprites,
      animations: [
        {
          key: Animations.Explosion,
          assetKey: Assets.MainAtlas,
          startFrame: 0,
          endFrame: 2,
          frameRate: 4,
          repeat: 2,
          prefix: "explosion/",
          suffix: ".png",
        },
        {
          key: Animations.Fire,
          assetKey: Assets.MainAtlas,
          startFrame: 0,
          endFrame: 1,
          frameRate: 4,
          repeat: -1,
          prefix: "fire/",
          suffix: ".png",
        },
      ],
      tilesets: {
        Default: { assetKey: Assets.DSTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
      },
    }),
  },
  scale: defineScaleConfig({
    zoom: 0.5,
    mode: Phaser.Scale.NONE,
  }),
  cameraConfig: defineCameraConfig({
    // phaserSelector: "phaser-game",
    pinchSpeed: 0.5,
    wheelSpeed: 0,
    maxZoom: 2,
    minZoom: 0.4,
  }),
  cullingChunkSize: TILE_HEIGHT * 16,
};
