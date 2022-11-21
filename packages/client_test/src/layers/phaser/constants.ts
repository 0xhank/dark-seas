export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

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
  OverworldTileset = "OverworldTileset",
  MountainTileset = "MountainTileset",
  MainAtlas = "MainAtlas",
}

export enum Arrows {
  Straight = "/img/arrows/straight.png",
  HardLeft = "/img/arrows/hard-left.png",
  HardRight = "/img/arrows/hard-right.png",
  Left = "/img/arrows/left.png",
  Right = "/img/arrows/right.png",
  SoftLeft = "/img/arrows/soft-left.png",
  SoftRight = "/img/arrows/soft-right.png",
  UTurn = "/img/arrows/uturn.png",
}

export enum Sprites {
  Hero,
  Settlement,
  Gold,
  Inventory,
  GoldShrine,
  EmberCrown,
  EscapePortal,
  Donkey,
  Crystal,
}

export enum Animations {}

export const UnitTypeSprites: Record<number, Sprites> = {};

export const ItemTypeSprites: Record<number, Sprites> = {};

export const StructureTypeSprites: Record<number, Sprites> = {};
