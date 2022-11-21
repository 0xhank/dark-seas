import { createWorld, EntityID, Type } from "@latticexyz/recs";
import { setupDevSystems } from "./setup";
import {
  createActionSystem,
  setupMUDNetwork,
  defineCoordComponent,
  defineNumberComponent,
  defineBoolComponent,
} from "@latticexyz/std-client";
import { defineLoadingStateComponent } from "./components";

import { SystemTypes } from "../../../../contracts/types/SystemTypes";
import { SystemAbis } from "../../../../contracts/types/SystemAbis.mjs";
import { GameConfig, getNetworkConfig } from "./config";
import { Coord } from "@latticexyz/utils";
import { Side } from "../../constants";
import { defineWindComponent } from "./components/WindComponent";
import { defineMoveCardComponent } from "./components/MoveCardComponent";

/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createNetworkLayer(config: GameConfig) {
  console.log("Network config", config);

  // --- WORLD ----------------------------------------------------------------------
  const world = createWorld();

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    LoadingState: defineLoadingStateComponent(world),
    Wind: defineWindComponent(world),
    MoveCard: defineMoveCardComponent(world),
    Position: defineCoordComponent(world, { id: "Position", metadata: { contractId: "ds.component.Position" } }),
    Rotation: defineNumberComponent(world, { id: "Rotation", metadata: { contractId: "ds.component.Rotation" } }),
    Length: defineNumberComponent(world, { id: "Length", metadata: { contractId: "ds.component.Length" } }),
    Range: defineNumberComponent(world, { id: "Range", metadata: { contractId: "ds.component.Range" } }),
    Health: defineNumberComponent(world, { id: "Health", metadata: { contractId: "ds.component.Health" } }),
    Ship: defineBoolComponent(world, { id: "Ship", metadata: { contractId: "ds.component.Ship" } }),
    SailPosition: defineNumberComponent(world, {
      id: "SailPosition",
      metadata: { contractId: "ds.component.SailPosition" },
    }),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { txQueue, systems, txReduced$, network, startSync, encoders } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(getNetworkConfig(config), world, components, SystemAbis);

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);

  // --- API ------------------------------------------------------------------------

  function spawnShip(location: Coord, rotation: number) {
    console.log("spawning ship at", location, `with rotation ${rotation}`);

    const length = 10;
    const range = 50;
    systems["ds.system.ShipSpawn"].executeTyped(location, rotation, length, range);
  }

  function move(shipId: EntityID, moveId: EntityID) {
    console.log("moving ship");
    systems["ds.system.Move"].executeTyped(shipId, moveId, {
      gasLimit: 30_000_000,
    });
  }

  function attack(shipId: EntityID, side: Side) {
    console.log("attacking!");
    systems["ds.system.Combat"].executeTyped(shipId, side);
  }

  function changeSail(shipId: EntityID, newPosition: number) {
    console.log(`changing sails of ${shipId} to ${newPosition}`);
    systems["ds.system.ChangeSail"].executeTyped(shipId, newPosition);
  }

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    components,
    txQueue,
    systems,
    txReduced$,
    startSync,
    network,
    actions,
    api: { spawnShip, move, attack, changeSail },
    dev: setupDevSystems(world, encoders as any, systems),
  };

  return context;
}
