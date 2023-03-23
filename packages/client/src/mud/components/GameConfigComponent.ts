import { defineComponent, Type } from "@latticexyz/recs";
import { world } from "../world";

export const GameConfigComponent = defineComponent(
  world,
  {
    startTime: Type.String,
    commitPhaseLength: Type.Number,
    revealPhaseLength: Type.Number,
    actionPhaseLength: Type.Number,
    worldSize: Type.Number,
    perlinSeed: Type.Number,
    entryCutoffTurns: Type.Number,
    buyin: Type.String,
    respawnAllowed: Type.Boolean,
    shrinkRate: Type.Number,
    budget: Type.Number,
    islandThreshold: Type.Number,
  },
  {
    id: "GameConfig",
    metadata: {
      contractId: "ds.component.GameConfig",
    },
  }
);
