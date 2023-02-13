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
    perlinSeed: Type.String,
    shipPrototypes: Type.StringArray,
    entryCutoffTurns: Type.Number,
    buyin: Type.String,
    respawnAllowed: Type.Boolean,
    shrinkRate: Type.Number,
  },
  {
    id: "GameConfig",
    metadata: {
      contractId: "component.GameConfig",
    },
  }
);
