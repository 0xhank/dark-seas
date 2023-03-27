import { createWorld, EntityIndex } from "@latticexyz/recs";
import { Howl } from "howler";
import { ShipPrototype } from "../types";

export const world = createWorld();

export const polygonRegistry = new Map<string | number, Phaser.GameObjects.Group>();
export const spriteRegistry = new Map<string | number, Phaser.GameObjects.Sprite>();
export const shipRegistry = new Map<EntityIndex | string, Phaser.GameObjects.Container>();

export const prototypeRegistry = new Map<EntityIndex, ShipPrototype>();
export const soundRegistry = new Map<string, Howl>();
export const musicRegistry = new Map<string, Howl>();

export const disposeRegistries = () => {
  polygonRegistry.clear();
  shipRegistry.clear();
  spriteRegistry.clear();
  prototypeRegistry.clear();
  soundRegistry.clear();
  musicRegistry.clear();
};
