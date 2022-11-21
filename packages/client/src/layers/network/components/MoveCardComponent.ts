import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineMoveCardComponent(world: World) {
  return defineComponent(
    world,
    { distance: Type.Number, direction: Type.Number, rotation: Type.Number },
    { id: "MoveCard", metadata: { contractId: "ds.component.MoveCard" } }
  );
}
