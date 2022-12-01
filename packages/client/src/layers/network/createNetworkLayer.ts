import { createWorld, defineComponent, EntityID, getComponentValue, Type } from "@latticexyz/recs";
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
import { Action } from "../../constants";
import { defineWindComponent } from "./components/WindComponent";
import { defineMoveCardComponent } from "./components/MoveCardComponent";
import { GodID } from "@latticexyz/network";

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
    GameConfig: defineComponent(
      world,
      { startTime: Type.String, movePhaseLength: Type.Number, actionPhaseLength: Type.Number },
      { id: "GameConfig", metadata: { contractId: "ds.component.GameConfig" } }
    ),
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
    CrewCount: defineNumberComponent(world, { id: "CrewCount", metadata: { contractId: "ds.component.CrewCount" } }),
    DamagedSail: defineBoolComponent(world, {
      id: "DamagedSail",
      metadata: { contractId: "ds.component.DamagedSail" },
    }),
    Leak: defineBoolComponent(world, { id: "Leak", metadata: { contractId: "ds.component.Leak" } }),
    OnFire: defineNumberComponent(world, { id: "OnFire", metadata: { contractId: "ds.component.OnFire" } }),
    Firepower: defineNumberComponent(world, { id: "Firepower", metadata: { contractId: "ds.component.Firepower" } }),
    LastMove: defineNumberComponent(world, { id: "LastMove", metadata: { contractId: "ds.component.LastMove" } }),
    LastAction: defineNumberComponent(world, { id: "LastAction", metadata: { contractId: "ds.component.LastAction" } }),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { txQueue, systems, txReduced$, network, startSync, encoders } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(getNetworkConfig(config), world, components, SystemAbis);

  const getGameConfig = () => {
    const godEntityIndex = world.entityToIndex.get(GodID);
    if (godEntityIndex == null) return;

    return getComponentValue(components.GameConfig, godEntityIndex);
  };

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);

  // --- API ------------------------------------------------------------------------

  function spawnShip(location: Coord, rotation: number) {
    console.log("spawning ship at", location, `with rotation ${rotation}`);

    const length = 10;
    const range = 50;
    systems["ds.system.ShipSpawn"].executeTyped(location, rotation, length, range);
  }

  function move(ships: EntityID[], moves: EntityID[]) {
    console.log("moving ship");
    systems["ds.system.Move"].executeTyped(ships, moves, {
      gasLimit: 30_000_000,
    });
  }

  function submitActions(ship: EntityID, actions: Action[]) {
    console.log("submitting actions");
    systems["ds.system.Action"].executeTyped(ship, actions);
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
    api: { getGameConfig, spawnShip, move, submitActions },
    dev: setupDevSystems(world, encoders as any, systems),
  };

  return context;
}
