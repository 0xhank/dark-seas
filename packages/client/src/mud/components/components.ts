import { defineComponent, Type } from "@latticexyz/recs";
import {
  defineBoolComponent,
  defineCoordComponent,
  defineNumberComponent,
  defineStringComponent,
} from "@latticexyz/std-client";
import { world } from "../world";
import { GameConfigComponent } from "./GameConfigComponent";
import { LoadingStateComponent } from "./LoadingStateComponent";
import { MoveCardComponent } from "./MoveCardComponent";

export const components = {
  GameConfig: GameConfigComponent,
  LoadingState: LoadingStateComponent,
  MoveCard: MoveCardComponent,
  Position: defineCoordComponent(world, { id: "Position", metadata: { contractId: "ds.component.Position" } }),
  Rotation: defineNumberComponent(world, { id: "Rotation", metadata: { contractId: "ds.component.Rotation" } }),
  Length: defineNumberComponent(world, { id: "Length", metadata: { contractId: "ds.component.Length" } }),
  Range: defineNumberComponent(world, { id: "Range", metadata: { contractId: "ds.component.Range" } }),
  Health: defineNumberComponent(world, { id: "Health", metadata: { contractId: "ds.component.Health" } }),
  MaxHealth: defineNumberComponent(world, { id: "MaxHealth", metadata: { contractId: "ds.component.MaxHealth" } }),
  Ship: defineBoolComponent(world, { id: "Ship", metadata: { contractId: "ds.component.Ship" } }),
  SailPosition: defineNumberComponent(world, {
    id: "SailPosition",
    metadata: { contractId: "ds.component.SailPosition" },
  }),
  DamagedCannons: defineNumberComponent(world, {
    id: "DamagedCannons",
    metadata: { contractId: "ds.component.DamagedCannons" },
  }),
  OnFire: defineNumberComponent(world, { id: "OnFire", metadata: { contractId: "ds.component.OnFire" } }),
  Firepower: defineNumberComponent(world, { id: "Firepower", metadata: { contractId: "ds.component.Firepower" } }),
  LastMove: defineNumberComponent(world, { id: "LastMove", metadata: { contractId: "ds.component.LastMove" } }),
  LastAction: defineNumberComponent(world, { id: "LastAction", metadata: { contractId: "ds.component.LastAction" } }),
  OwnedBy: defineComponent(
    world,
    { value: Type.Entity },
    { id: "OwnedBy", metadata: { contractId: "ds.component.OwnedBy" } }
  ),
  Player: defineNumberComponent(world, { id: "Player", metadata: { contractId: "ds.component.Player" } }),
  Name: defineStringComponent(world, { id: "Name", metadata: { contractId: "ds.component.Name" } }),
  Commitment: defineStringComponent(world, { id: "Commitment", metadata: { contractId: "ds.component.Commitment" } }),
  Cannon: defineBoolComponent(world, { id: "Cannon", metadata: { contractId: "ds.component.Cannon" } }),
  Loaded: defineBoolComponent(world, { id: "Loaded", metadata: { contractId: "ds.component.Loaded" } }),
  Speed: defineNumberComponent(world, { id: "Speed", metadata: { contractId: "ds.component.Speed" } }),
  ShipPrototype: defineStringComponent(world, {
    id: "ShipPrototype",
    metadata: { contractId: "ds.component.ShipPrototype" },
  }),
  Kills: defineNumberComponent(world, { id: "Kills", metadata: { contractId: "ds.component.Kills" } }),
  LastHit: defineStringComponent(world, { id: "LastHit", metadata: { contractId: "ds.component.LastHit" } }),
  Booty: defineStringComponent(world, { id: "Booty", metadata: { contractId: "ds.component.Booty" } }),
};

export const clientComponents = {
  SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
  SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
  HoveredShip: defineNumberComponent(world, { id: "HoveredShip" }),
  HoveredAction: defineComponent(
    world,
    { shipEntity: Type.Number, actionType: Type.Number, specialEntity: Type.Number },
    { id: "HoveredAction" }
  ),
  HoveredMove: defineComponent(world, { shipEntity: Type.Number, moveCardEntity: Type.Number }, { id: "HoveredMove" }),
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
    { targets: Type.NumberArray, damage: Type.NumberArray, specialDamage: Type.NumberArray },
    { id: "ExecutedShots" }
  ),

  ExecutedActions: defineComponent(world, { value: Type.NumberArray }, { id: "ExecutedActions" }),
  ExecutedCannon: defineBoolComponent(world, { id: "ExecutedLoad" }),

  ModalOpen: defineBoolComponent(world, {
    id: "ModalOpen",
  }),
  HealthLocal: defineNumberComponent(world, { id: "HealthLocal" }),
  HealthBackend: defineNumberComponent(world, { id: "HealthBackend" }),
  OnFireLocal: defineNumberComponent(world, { id: "OnFireLocal" }),
  DamagedCannonsLocal: defineNumberComponent(world, { id: "DamagedCannonsLocal" }),
  SailPositionLocal: defineNumberComponent(world, { id: "SailPositionLocal" }),
  Volume: defineNumberComponent(world, { id: "Volume" }),
  MapBounds: defineComponent(world, {
    top: Type.Number,
    right: Type.Number,
    bottom: Type.Number,
    left: Type.Number,
  }),

  // USED IN FLEET SELECTION

  ActiveShip: defineNumberComponent(world, { id: "ActiveShip" }),
  StagedShips: defineComponent(world, { value: Type.NumberArray }, { id: "StagedShips" }),
};
