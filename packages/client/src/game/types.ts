import { EntityID, EntityIndex } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { gameLayer } from "./phaser";
export const DELAY = 5000;
export type SetupResult = gameLayer;
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

export type ShipPrototype = {
  price: number;
  length: number;
  maxHealth: number;
  speed: number;
  cannons: CannonPrototype[];
  name: string;
};

export type CannonPrototype = {
  rotation: number;
  firepower: number;
  range: number;
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

  ClaimCrate,
}
export const ActionHashes: Record<ActionType, string> = {
  [ActionType.None]: "action.none",
  [ActionType.Load]: "action.load",
  [ActionType.Fire]: "action.fire",
  [ActionType.RaiseSail]: "action.raiseSail",
  [ActionType.LowerSail]: "action.lowerSail",
  [ActionType.ExtinguishFire]: "action.ExtinguishFire",
  [ActionType.RepairCannons]: "action.repairCannons",
  [ActionType.RepairSail]: "action.repairSail",
  [ActionType.ClaimCrate]: "action.claimCrate",
};

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
  [ActionType.ClaimCrate]: "Claim Crate",
};

export const ActionImg: Record<number, string> = {
  [ActionType.None]: "",
  [ActionType.Fire]: "/icons/fire-forward.svg",
  [ActionType.Load]: "/icons/load.svg",
  [ActionType.RaiseSail]: "/icons/sail.svg",
  [ActionType.LowerSail]: "/icons/anchor.svg",
  [ActionType.ExtinguishFire]: "/icons/extinguish.svg",
  [ActionType.RepairCannons]: "/icons/damaged-cannons.svg",
  [ActionType.RepairSail]: "/icons/broken-sail.svg",
  [ActionType.ClaimCrate]: "",
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

  HealthCrate1,
  HealthCrate2,

  SpeedCrate1,
  SpeedCrate2,

  SizeCrate1,
  SizeCrate2,

  FirepowerCrate1,
  FirepowerCrate2,
}

export const ModalType = {
  LEADERBOARD: 0 as EntityIndex,
  TUTORIAL: 1 as EntityIndex,
  BOTTOM_BAR: 2 as EntityIndex,
};

export const HoverType = {
  SHIP: 0 as EntityIndex,
  CRATE: 1 as EntityIndex,
};

export enum TxType {
  Action,
  Commit,
  Reveal,
}