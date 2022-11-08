import { createWorld } from "@latticexyz/recs";
import { setupDevSystems } from "./setup";
import {
  createActionSystem,
  setupMUDNetwork,
  defineCoordComponent,
  defineNumberComponent,
} from "@latticexyz/std-client";
import { defineLoadingStateComponent } from "./components";
import { SystemTypes } from "contracts/types/SystemTypes";
import { SystemAbis } from "contracts/types/SystemAbis.mjs";
import { GameConfig, getNetworkConfig } from "./config";
import { BigNumber } from "ethers";
import { Coord } from "@latticexyz/utils";

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
    Position: defineCoordComponent(world, { id: "Position", metadata: { contractId: "ds.component.Position" } }),
    Rotation: defineNumberComponent(world, { id: "Rotation", metadata: { contractId: "ds.component.Rotation" } }),
    MoveAngle: defineNumberComponent(world, {
      id: "MoveAngle",
      metadata: { contractId: "ds.component.MoveAngle" },
    }),
    MoveDistance: defineNumberComponent(world, {
      id: "MoveDistance",
      metadata: { contractId: "ds.component.MoveDistance" },
    }),
    MoveRotation: defineNumberComponent(world, {
      id: "MoveRotation",
      metadata: { contractId: "ds.component.MoveRotation" },
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
    systems["ds.system.ShipSpawn"].executeTyped(location, rotation);
  }

  function move(dest: Coord) {
    systems["ds.system.Move"].executeTyped(BigNumber.from(network.connectedAddress.get()), dest, {
      gasLimit: 30_000_000,
    });
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
    api: { spawnShip, move },
    dev: setupDevSystems(world, encoders, systems),
  };

  return context;
}
