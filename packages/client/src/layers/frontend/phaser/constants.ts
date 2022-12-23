import { Sprites } from "../../../types";

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64;

export const POS_WIDTH = TILE_WIDTH / 4;
export const POS_HEIGHT = TILE_HEIGHT / 4;

export const SHIP_RATIO = 113 / 66;
export enum Scenes {
  Main = "Main",
}

export enum Maps {
  Main = "Main",
  Pixel = "Pixel",
  Tactic = "Tactic",
  Strategic = "Strategic",
}

export enum Assets {
  DSTileset = "DSTileset",
  MainAtlas = "MainAtlas",
}

export enum RenderDepth {
  UI1 = 500,
  UI2 = 490,
  UI3 = 480,
  UI4 = 470,
  UI5 = 460,

  Foreground1 = 400,
  Foreground2 = 390,
  Foreground3 = 380,
  Foreground4 = 370,
  Foreground5 = 360,

  Background1 = 20,
  Background2 = 10,
  Background3 = 0, // tilemap sits here
  Background4 = -10,
  Background5 = -20,
}

export enum Animations {
  Explosion = "Explosion",
}

export const UnitTypeSprites: Record<number, Sprites> = {};

export const ItemTypeSprites: Record<number, Sprites> = {};

export const StructureTypeSprites: Record<number, Sprites> = {};
