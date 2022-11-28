import {
  defineSceneConfig,
  AssetType,
  defineScaleConfig,
  defineMapConfig,
  defineCameraConfig,
} from "@latticexyz/phaserx";
import { Sprites, Assets, Maps, Scenes, TILE_HEIGHT, TILE_WIDTH } from "./constants";
import dsTileset from "./assets/tilesets/ds-tilesheet.png";
import { DSTileset } from "./assets/tilesets/dsTilesheet";
const ANIMATION_INTERVAL = 200;

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
      sprites: {
        [Sprites.Cannon]: {
          assetKey: Assets.MainAtlas,
          frame: "cannon.png",
        },
        [Sprites.Cannonball]: {
          assetKey: Assets.MainAtlas,
          frame: "cannonBall.png",
        },
        [Sprites.Explosion1]: {
          assetKey: Assets.MainAtlas,
          frame: "explosion1.png",
        },
        [Sprites.Explosion2]: {
          assetKey: Assets.MainAtlas,
          frame: "explosion2.png",
        },
        [Sprites.Explosion3]: {
          assetKey: Assets.MainAtlas,
          frame: "explosion3.png",
        },

        [Sprites.ShipGreen]: {
          assetKey: Assets.MainAtlas,
          frame: "shipGreen.png",
        },
        [Sprites.ShipGreenDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipGreenDead.png",
        },
        [Sprites.ShipGreenMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipGreenMajor.png",
        },
        [Sprites.ShipGreenMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipGreenMinor.png",
        },

        [Sprites.ShipWhite]: {
          assetKey: Assets.MainAtlas,
          frame: "shipWhite.png",
        },
        [Sprites.ShipWhiteDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipWhiteDead.png",
        },
        [Sprites.ShipWhiteMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipWhiteMajor.png",
        },
        [Sprites.ShipWhiteMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipWhiteMinor.png",
        },

        [Sprites.ShipBlue]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlue.png",
        },
        [Sprites.ShipBlueDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlueDead.png",
        },
        [Sprites.ShipBlueMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlueMajor.png",
        },
        [Sprites.ShipBlueMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlueMinor.png",
        },

        [Sprites.ShipBlack]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlack.png",
        },
        [Sprites.ShipBlackDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlackDead.png",
        },
        [Sprites.ShipBlackMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlackMajor.png",
        },
        [Sprites.ShipBlackMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipBlackMinor.png",
        },

        [Sprites.ShipYellow]: {
          assetKey: Assets.MainAtlas,
          frame: "shipYellow.png",
        },
        [Sprites.ShipYellowDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipYellowDead.png",
        },
        [Sprites.ShipYellowMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipYellowMajor.png",
        },
        [Sprites.ShipYellowMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipYellowMinor.png",
        },

        [Sprites.ShipRed]: {
          assetKey: Assets.MainAtlas,
          frame: "shipRed.png",
        },
        [Sprites.ShipRedDead]: {
          assetKey: Assets.MainAtlas,
          frame: "shipRedDead.png",
        },
        [Sprites.ShipRedMajor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipRedMajor.png",
        },
        [Sprites.ShipRedMinor]: {
          assetKey: Assets.MainAtlas,
          frame: "shipRedMinor.png",
        },
      },
      animations: [],
      tilesets: {
        Default: { assetKey: Assets.DSTileset, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT },
      },
    }),
  },
  scale: defineScaleConfig({
    parent: "phaser-game",
    zoom: 1,
    mode: Phaser.Scale.NONE,
  }),
  cameraConfig: defineCameraConfig({
    phaserSelector: "phaser-game",
    pinchSpeed: 1,
    wheelSpeed: 1,
    maxZoom: 4,
    minZoom: 0.1,
  }),
  cullingChunkSize: TILE_HEIGHT * 16,
};
