import { Coord } from "@latticexyz/utils";
import { boot } from "./boot";
import { BackendLayer } from "./layers/backend";
import { PhaserLayer } from "./layers/frontend/phaser";
import { NetworkLayer } from "./layers/network";

export type DSWindow = Awaited<ReturnType<typeof boot>>;

export type Layers = { network: NetworkLayer; backend: BackendLayer; phaser: PhaserLayer };

export enum Action {
  FireForward,
  FireLeft,
  FireRight,
  RaiseSail,
  LowerSail,
  ExtinguishFire,
  RepairLeak,
  RepairMast,
  RepairSail,
}

export enum Side {
  Forward,
  Right,
  Left,
}

export enum Phase {
  Commit,
  Reveal,
  Action,
}

// this makes me sad
// TODO: make this make me not sad
export const ActionToSide: Record<number, number> = {
  [Action.FireForward]: Side.Forward,
  [Action.FireLeft]: Side.Left,
  [Action.FireRight]: Side.Right,
  [Side.Forward]: Action.FireForward,
  [Side.Left]: Action.FireLeft,
  [Side.Right]: Action.FireRight,
};

export const PhaseNames: Record<number, string> = {
  [Phase.Commit]: "Move Preparation",
  [Phase.Reveal]: "Move Execution",
  [Phase.Action]: "Action",
};

export const ActionNames: Record<number, string> = {
  [Action.FireForward]: "Fire Forward",
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
  [Action.FireForward]: "/icons/fire-forward.svg",
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
  Battle,
  Open,
}

export const SailPositionNames: Record<number, string> = {
  [SailPositions.Broken]: "Broken",
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
