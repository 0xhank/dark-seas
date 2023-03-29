import { defineComponent, Type } from "@latticexyz/recs";
import { world } from "../mud/world";

export const UpgradeComponent = defineComponent(
  world,
  { componentId: Type.String, amount: Type.Number },
  { id: "Upgrade", metadata: { contractId: "ds.component.Upgrade" } }
);
