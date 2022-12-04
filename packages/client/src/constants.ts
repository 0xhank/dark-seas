import { Coord } from "@latticexyz/utils";

export enum Action {
  FireRight,
  FireLeft,
  RaiseSail,
  LowerSail,
  ExtinguishFire,
  RepairLeak,
  RepairMast,
  RepairSail,
}

export enum Side {
  Right,
  Left,
}

export enum Phase {
  Move,
  Action,
}

export const PhaseNames: Record<number, string> = {
  [Phase.Move]: "Move",
  [Phase.Action]: "Action",
};

export const ActionNames: Record<number, string> = {
  [Action.FireRight]: "Fire Right",
  [Action.FireLeft]: "Fire Left",
  [Action.RaiseSail]: "Raise Sail",
  [Action.LowerSail]: "Lower Sail",
  [Action.ExtinguishFire]: "Extinguish Fire",
  [Action.RepairLeak]: "Repair Leak",
  [Action.RepairMast]: "Repair Mast",
  [Action.RepairSail]: "Repair Sail",
};

export const ActionImg: Record<number, string> = {
  [Action.FireRight]: "/icons/fire-right.svg",
  [Action.FireLeft]: "/icons/fire-left.svg",
  [Action.RaiseSail]: "/icons/sail.svg",
  [Action.LowerSail]: "/icons/anchor.svg",
  [Action.ExtinguishFire]: "/icons/extinguish.svg",
  [Action.RepairLeak]: "/icons/planks.svg",
  [Action.RepairMast]: "/icons/broken-mast.svg",
  [Action.RepairSail]: "/icons/broken-sail.svg",
};

export type Line = {
  p1: Coord;
  p2: Coord;
};

export enum SailPositions {
  Broken,
  Closed,
  Battle,
  Open,
}

export const SailPositionNames: Record<number, string> = {
  [SailPositions.Broken]: "Broken",
  [SailPositions.Closed]: "Closed",
  [SailPositions.Battle]: "Battle",
  [SailPositions.Open]: "Open",
};

export type MoveCard = {
  distance: number;
  rotation: number;
  direction: number;
};

export type Wind = {
  speed: number;
  direction: number;
};

export enum Sprites {
  Cannon,
  Cannonball,
  Explosion1,
  Explosion2,
  Explosion3,
  Fire1,
  Fire2,
  ShipBlack,
  ShipBlackDead,
  ShipBlackMajor,
  ShipBlackMinor,

  ShipWhite,
  ShipWhiteDead,
  ShipWhiteMajor,
  ShipWhiteMinor,

  ShipYellow,
  ShipYellowDead,
  ShipYellowMajor,
  ShipYellowMinor,

  ShipGreen,
  ShipGreenDead,
  ShipGreenMajor,
  ShipGreenMinor,

  ShipRed,
  ShipRedDead,
  ShipRedMajor,
  ShipRedMinor,

  ShipBlue,
  ShipBlueDead,
  ShipBlueMajor,
  ShipBlueMinor,
}

export const ShipImages: Record<number, string> = {
  [Sprites.ShipWhite]: "/img/ships/shipWhite.png",
  [Sprites.ShipWhiteDead]: "/img/ships/shipWhiteDead.png",
  [Sprites.ShipWhiteMajor]: "/img/ships/shipWhiteMajor.png",
  [Sprites.ShipBlackMinor]: "/img/ships/shipWhiteMinor.png",

  [Sprites.ShipGreen]: "/img/ships/shipGreen.png",
  [Sprites.ShipGreenDead]: "/img/ships/shipGreenDead.png",
  [Sprites.ShipGreenMajor]: "/img/ships/shipGreenMajor.png",
  [Sprites.ShipGreenMinor]: "/img/ships/shipGreenMinor.png",

  [Sprites.ShipBlack]: "/img/ships/shipBlack.png",
  [Sprites.ShipBlackDead]: "/img/ships/shipBlackDead.png",
  [Sprites.ShipBlackMajor]: "/img/ships/shipBlackMajor.png",
  [Sprites.ShipBlackMinor]: "/img/ships/shipBlackMinor.png",

  [Sprites.ShipBlue]: "/img/ships/shipBlue.png",
  [Sprites.ShipBlueDead]: "/img/ships/shipBlueDead.png",
  [Sprites.ShipBlueMajor]: "/img/ships/shipBlueMajor.png",
  [Sprites.ShipBlueMinor]: "/img/ships/shipBlueMinor.png",

  [Sprites.ShipYellow]: "/img/ships/shipYellow.png",
  [Sprites.ShipYellowDead]: "/img/ships/shipYellowDead.png",
  [Sprites.ShipYellowMajor]: "/img/ships/shipYellowMajor.png",
  [Sprites.ShipYellowMinor]: "/img/ships/shipYellowMinor.png",

  [Sprites.ShipRed]: "/img/ships/shipRed.png",
  [Sprites.ShipRedDead]: "/img/ships/shipRedDead.png",
  [Sprites.ShipRedMajor]: "/img/ships/shipRedMajor.png",
  [Sprites.ShipGreenMinor]: "/img/ships/shipRedMinor.png",
};
