import { defineComponent, Type, World } from "@latticexyz/recs";
import { defineBoolComponent, defineNumberComponent, defineStringComponent } from "@latticexyz/std-client";

export function createBackendComponents(world: World) {
  return {
    SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
    SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
    HoveredShip: defineNumberComponent(world, { id: "HoveredShip" }),
    HoveredAction: defineComponent(
      world,
      { shipEntity: Type.Number, actionType: Type.Number, specialEntity: Type.Number },
      { id: "HoveredAction" }
    ),
    HoveredMove: defineComponent(
      world,
      { shipEntity: Type.Number, moveCardEntity: Type.Number },
      { id: "HoveredMove" }
    ),
    SelectedActions: defineComponent(
      world,
      { actionTypes: Type.NumberArray, specialEntities: Type.EntityArray },
      { id: "Actions" }
    ),
    EncodedCommitment: defineStringComponent(world, { id: "EncodedCommitment" }),
    CommittedMove: defineComponent(world, { value: Type.Number }, { id: "CommittedMove" }),
    Targeted: defineNumberComponent(world, { id: "Targeted" }),

    ExecutedShots: defineComponent(
      world,
      { targets: Type.NumberArray, damage: Type.NumberArray },
      { id: "ExecutedShots" }
    ),
    ExecutedLoad: defineBoolComponent(world, { id: "ExecutedLoad" }),
    ExecutedChangeSail: defineBoolComponent(world, { id: "ExecutedRaiseSail" }),
    ExecutedExtinguishFire: defineBoolComponent(world, { id: "ExecutedExtinguishFire" }),
    ExecutedRepairSail: defineBoolComponent(world, { id: "ExecutedRepairSail" }),
    ExecutedRepairCannons: defineBoolComponent(world, { id: "ExecutedRepairCannons" }),
    LeaderboardOpen: defineBoolComponent(world, {
      id: "LeaderboardOpen",
    }),
    LocalHealth: defineNumberComponent(world, { id: "LocalHealth" }),
  };
}

export type BackendComponents = Awaited<ReturnType<typeof createBackendComponents>>;
