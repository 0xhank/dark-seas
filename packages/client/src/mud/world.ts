import { createWorld } from "@latticexyz/recs";

export const world = createWorld();

export const polygonRegistry = new Map<string | number, Phaser.GameObjects.Group>();
export const spriteRegistry = new Map<string | number, Phaser.GameObjects.Sprite>();
