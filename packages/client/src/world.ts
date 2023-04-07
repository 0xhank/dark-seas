import { createWorld } from "@latticexyz/recs";
import { Howl } from "howler";

export const world = createWorld();

export const polygonRegistry = new Map<string | number, Phaser.GameObjects.Group>();
export const spriteRegistry = new Map<string | number, Phaser.GameObjects.Sprite>();
export const soundRegistry = new Map<string, Howl>();
export const musicRegistry = new Map<string, Howl>();

export const disposeRegistries = () => {
  polygonRegistry.clear();
  spriteRegistry.clear();
  soundRegistry.clear();
  musicRegistry.clear();
};
