import { defineComponent, Type, World } from "@latticexyz/recs";

export function defineWindComponent(world: World) {
  return defineComponent(
    world,
    { speed: Type.Number, direction: Type.Number },
    { id: "Wind", metadata: { contractId: "ds.component.Wind" } }
  );
}
