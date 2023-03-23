import { defineComponent, Type } from "@latticexyz/recs";
import { world } from "../world";

export const defineActionComponent = defineComponent(
  world,
  { contr: Type.String, func: Type.String },
  {
    id: "Action",
    metadata: { contractId: "ds.component.Action" },
  }
);
