import { defineComponent, Type } from "@latticexyz/recs";
import { world } from "../mud/world";

export const MoveCardComponent = defineComponent(
  world,
  { distance: Type.Number, direction: Type.Number, rotation: Type.Number },
  { id: "MoveCard", metadata: { contractId: "ds.component.MoveCard" } }
);
