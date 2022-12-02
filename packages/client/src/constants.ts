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
