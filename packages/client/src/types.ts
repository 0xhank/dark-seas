import { EntityID } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { boot } from "./boot";
import { BackendLayer } from "./layers/backend";
import { PhaserLayer } from "./layers/frontend/phaser";
import { NetworkLayer } from "./layers/network";

export type DSWindow = Awaited<ReturnType<typeof boot>>;

export type Layers = { network: NetworkLayer; backend: BackendLayer; phaser: PhaserLayer };

export type Action = {
  shipEntity: EntityID;
  actionTypes: [ActionType, ActionType];
  specialEntities: [EntityID, EntityID];
};

export type ActionWithTargets = Action & { targets: [EntityID[] | undefined, EntityID[] | undefined] };

export type Move = {
  shipEntity: EntityID;
  moveCardEntity: EntityID;
};

export enum ActionType {
  None,
  Load,
  Fire,
  RaiseSail,
  LowerSail,
  ExtinguishFire,
  RepairCannons,
  RepairSail,
}

export enum Phase {
  Commit,
  Reveal,
  Action,
}

export const ActionNames: Record<number, string> = {
  [ActionType.Fire]: "Fire",
  [ActionType.Load]: "Load",
  [ActionType.None]: "None",
  [ActionType.RaiseSail]: "Raise Sail",
  [ActionType.LowerSail]: "Lower Sail",
  [ActionType.ExtinguishFire]: "Extinguish Fire",
  [ActionType.RepairCannons]: "Repair Cannons",
  [ActionType.RepairSail]: "Repair Sail",
};

export const ActionImg: Record<number, string> = {
  [ActionType.Fire]: "/icons/fire-forward.svg",
  [ActionType.Load]: "/icons/load.svg",
  [ActionType.RaiseSail]: "/icons/sail.svg",
  [ActionType.LowerSail]: "/icons/anchor.svg",
  [ActionType.ExtinguishFire]: "/icons/extinguish.svg",
  [ActionType.RepairCannons]: "/icons/damaged-cannons.svg",
  [ActionType.RepairSail]: "/icons/broken-sail.svg",
};

export type Line = {
  p1: Coord;
  p2: Coord;
};

export enum SailPositions {
  Torn,
  Lowered,
  Full,
}

export const SailPositionNames: Record<number, string> = {
  [SailPositions.Torn]: "Torn",
  [SailPositions.Lowered]: "Lowered",
  [SailPositions.Full]: "Full",
};

export type MoveCard = {
  distance: number;
  rotation: number;
  direction: number;
};

export enum Sprites {
  Cannon,
  Cannonball,
  DeadMan,
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

export enum ModalType {
  LEADERBOARD,
  TUTORIAL,
}
