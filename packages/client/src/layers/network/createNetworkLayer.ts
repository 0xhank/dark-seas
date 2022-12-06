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
import { keccak256, defaultAbiCoder as abi } from "ethers/lib/utils";

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
        commitPhaseLength: Type.Number,
        revealPhaseLength: Type.Number,
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
    Commitment: defineStringComponent(world, { id: "Commitment", metadata: { contractId: "ds.component.Commitment" } }),
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
    const turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    const secondsUntilNextTurn = turnLength - (timeElapsed % turnLength);

    if (secondsUntilNextTurn < gameConfig.actionPhaseLength) return Phase.Action;
    if (secondsUntilNextTurn < gameConfig.actionPhaseLength + gameConfig.revealPhaseLength) return Phase.Reveal;
    return Phase.Commit;
  }

  function getCurrentGameTurn(): number | undefined {
    const gamePhase = getGameTurnAt(network.clock.currentTime / 1000);
    return gamePhase;
  }

  function getGameTurnAt(timeInSeconds: number): number | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    return Math.floor(timeElapsed / turnLength);
  }

  // --- ACTION SYSTEM --------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);

  // --- API ------------------------------------------------------------------------

  function commitMove(ships: EntityID[], moves: EntityID[]) {
    const commitment = keccak256(abi.encode(["uint256[]", "uint256[]", "uint256"], [ships, moves, 0]));
    systems["ds.system.Commit"].executeTyped(commitment);
  }

  function spawnPlayer(name: string, location: Coord) {
    systems["ds.system.PlayerSpawn"].executeTyped(name, location);
  }

  function spawnShip(location: Coord, rotation: number) {
    systems["ds.system.ShipSpawn"].executeTyped(location, rotation);
  }

  function revealMove(ships: EntityID[], moves: EntityID[]) {
    systems["ds.system.Move"].executeTyped(ships, moves, 0);
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
    utils: { getGameConfig, getPlayerEntity, getCurrentGamePhase, getGamePhaseAt, getCurrentGameTurn, commitMove },
    api: { spawnShip, revealMove, submitActions, spawnPlayer, commitMove },
    dev: setupDevSystems(world, encoders as Promise<any>, systems),
  };

  return context;
}
