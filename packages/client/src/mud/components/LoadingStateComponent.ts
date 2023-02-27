import { defineComponent, Type } from "@latticexyz/recs";
import { world } from "../world";

export const LoadingStateComponent = defineComponent(
  world,
  {
    state: Type.Number,
    msg: Type.String,
    percentage: Type.Number,
  },
  {
    id: "LoadingState",
    metadata: {
      contractId: "component.LoadingState",
    },
  }
);
