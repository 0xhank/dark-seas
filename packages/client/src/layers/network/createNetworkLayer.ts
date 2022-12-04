import {
  createWorld,
  defineComponent,
  EntityID,
  EntityIndex,
  getComponentValue,
  hasComponent,
  Type,
} from "@latticexyz/recs";
import { setupDevSystems } from "./setup";
import {
  createActionSystem,
  setupMUDNetwork,
  defineCoordComponent,
  defineNumberComponent,
  defineBoolComponent,
  defineStringComponent,
} from "@latticexyz/std-client";
import { defineLoadingStateComponent } from "./components";

import { SystemTypes } from "../../../../contracts/types/SystemTypes";
import { SystemAbis } from "../../../../contracts/types/SystemAbis.mjs";
import { GameConfig, getNetworkConfig } from "./config";
import { Coord } from "@latticexyz/utils";
import { Action, Phase } from "../../constants";
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
      {
        startTime: Type.String,
        movePhaseLength: Type.Number,
        actionPhaseLength: Type.Number,
        worldRadius: Type.Number,
      },
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
    DamagedMast: defineNumberComponent(world, {
      id: "DamagedMast",
      metadata: { contractId: "ds.component.DamagedMast" },
    }),
    Leak: defineBoolComponent(world, { id: "Leak", metadata: { contractId: "ds.component.Leak" } }),
    OnFire: defineNumberComponent(world, { id: "OnFire", metadata: { contractId: "ds.component.OnFire" } }),
    Firepower: defineNumberComponent(world, { id: "Firepower", metadata: { contractId: "ds.component.Firepower" } }),
    LastMove: defineNumberComponent(world, { id: "LastMove", metadata: { contractId: "ds.component.LastMove" } }),
    LastAction: defineNumberComponent(world, { id: "LastAction", metadata: { contractId: "ds.component.LastAction" } }),
    OwnedBy: defineComponent(
      world,
      { value: Type.Entity },
      { id: "OwnedBy", metadata: { contractId: "ds.component.OwnedBy" } }
    ),
    Player: defineBoolComponent(world, { id: "Player", metadata: { contractId: "ds.component.Player" } }),
    Name: defineStringComponent(world, { id: "Name", metadata: { contractId: "ds.component.Name" } }),
  };

  // --- SETUP ----------------------------------------------------------------------
  const { txQueue, systems, txReduced$, network, startSync, encoders } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(getNetworkConfig(config), world, components, SystemAbis);

  // --- UTILITIES ------------------------------------------------------------------
  const getGameConfig = () => {
    const godEntityIndex = world.entityToIndex.get(GodID);
    if (godEntityIndex == null) return;

    return getComponentValue(components.GameConfig, godEntityIndex);
  };

  function getPlayerEntity(address: string | undefined): EntityIndex | undefined {
    if (!address) return;

    const playerEntity = world.entityToIndex.get(address as EntityID);
    if (playerEntity == null || !hasComponent(components.Player, playerEntity)) return;

    return playerEntity;
  }

  function getCurrentGamePhase(): Phase | undefined {
    const gamePhase = getGamePhaseAt(network.clock.currentTime / 1000);
    return gamePhase;
  }

  function getGamePhaseAt(timeInSeconds: number): Phase | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.movePhaseLength + gameConfig.actionPhaseLength;

    const secondsUntilNextTurn = turnLength - (timeElapsed % turnLength);

    return secondsUntilNextTurn > gameConfig.actionPhaseLength ? Phase.Move : Phase.Action;
  }

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);

  // --- API ------------------------------------------------------------------------

  function spawnPlayer(name: string) {
    systems["ds.system.PlayerSpawn"].executeTyped(name, Date.now());
  }

  function spawnShip(location: Coord, rotation: number) {
    console.log("spawning ship at", location, `with rotation ${rotation}`);

    systems["ds.system.ShipSpawn"].executeTyped(location, rotation);
  }

  function move(ships: EntityID[], moves: EntityID[]) {
    console.log("moving ship");
    systems["ds.system.Move"].executeTyped(ships, moves, {
      gasLimit: 30_000_000,
    });
  }

  function submitActions(ships: EntityID[], actions: Action[][]) {
    console.log("submitting actions");
    systems["ds.system.Action"].executeTyped(ships, actions);
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
    utils: { getGameConfig, getPlayerEntity, getCurrentGamePhase, getGamePhaseAt },
    api: { spawnShip, move, submitActions, spawnPlayer },
    dev: setupDevSystems(world, encoders as Promise<any>, systems),
  };

  return context;
}
