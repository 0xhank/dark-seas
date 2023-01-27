import {
  createWorld,
  defineComponent,
  EntityID,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  hasComponent,
  Type,
} from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";

import {
  defineBoolComponent,
  defineCoordComponent,
  defineNumberComponent,
  defineStringComponent,
  setupMUDNetwork,
} from "@latticexyz/std-client";
import { setupDevSystems } from "./setup";

import { createFaucetService, createNetwork, GodID, Network } from "@latticexyz/network";
import { Coord, keccak256 } from "@latticexyz/utils";
import { BigNumber, BigNumberish, utils, Wallet } from "ethers";
import { ActionStruct } from "../../../../contracts/types/ethers-contracts/ActionSystem";
import { MoveStruct } from "../../../../contracts/types/ethers-contracts/MoveSystem";
import { SystemAbis } from "../../../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../../../contracts/types/SystemTypes";
import { Phase } from "../../types";
import { defineLoadingStateComponent } from "./components/LoadingStateComponent";
import { defineMoveCardComponent } from "./components/MoveCardComponent";
import { GameConfig, getNetworkConfig } from "./config";

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
        worldSize: Type.Number,
        perlinSeed: Type.String,
      },
      { id: "GameConfig", metadata: { contractId: "ds.component.GameConfig" } }
    ),
    LoadingState: defineLoadingStateComponent(world),
    MoveCard: defineMoveCardComponent(world),
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
    Player: defineBoolComponent(world, { id: "Player", metadata: { contractId: "ds.component.Player" } }),
    Name: defineStringComponent(world, { id: "Name", metadata: { contractId: "ds.component.Name" } }),
    Commitment: defineStringComponent(world, { id: "Commitment", metadata: { contractId: "ds.component.Commitment" } }),
    Cannon: defineBoolComponent(world, { id: "Cannon", metadata: { contractId: "ds.component.Cannon" } }),
    Loaded: defineBoolComponent(world, { id: "Loaded", metadata: { contractId: "ds.component.Loaded" } }),
    Speed: defineNumberComponent(world, { id: "Speed", metadata: { contractId: "ds.component.Speed" } }),
    Kills: defineNumberComponent(world, { id: "Kills", metadata: { contractId: "ds.component.Kills" } }),
    LastHit: defineNumberComponent(world, { id: "LastHit", metadata: { contractId: "ds.component.LastHit" } }),
  };

  // --- SETUP ----------------------------------------------------------------------
  const {
    txQueue,
    systems,
    txReduced$,
    network: ownerNetwork,
    startSync,
    encoders,
    systemCallStreams,
  } = await setupMUDNetwork<typeof components, SystemTypes>(getNetworkConfig(config), world, components, SystemAbis, {
    fetchSystemCalls: true,
  });

  let network: Network | undefined = await createBurnerNetwork(config.burnerPrivateKey);

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";

  if (!config.devMode) {
    const faucet = createFaucetService(faucetUrl);
    const address = activeNetwork().connectedAddress.get();
    console.info("[Dev Faucet]: Player Address -> ", address);

    const requestDrip = async () => {
      const balance = await activeNetwork().signer.get()?.getBalance();
      console.info(`[Dev Faucet]: Player Balance -> ${balance}`);
      const playerIsBroke = balance?.lte(utils.parseEther(".5"));
      console.info(`[Dev Faucet]: Player is broke -> ${playerIsBroke}`);
      if (playerIsBroke) {
        console.info("[Dev Faucet]: Dripping funds to player");
        // Double drip
        address && (await faucet?.dripDev({ address })) && (await faucet?.dripDev({ address }));
        address && (await faucet?.dripDev({ address })) && (await faucet?.dripDev({ address }));
        address && (await faucet?.dripDev({ address })) && (await faucet?.dripDev({ address }));
      }
    };

    requestDrip();
    // Request a drip every 20 seconds
    setInterval(requestDrip, 5000);
  }

  // --- UTILITIES ------------------------------------------------------------------

  function activeNetwork() {
    return network || ownerNetwork;
  }
  async function createBurnerNetwork(privateKey: string | null) {
    if (!privateKey || config.devMode) return;
    const burnerConfig = {
      ...config,
      privateKey,
    };
    localStorage.setItem(`burnerWallet-${config.worldAddress}`, privateKey);
    const network = await createNetwork(getNetworkConfig(burnerConfig));

    const signer = network.signer.get();
    if (!signer) return;

    systems["ds.system.Action"].connect(signer);
    systems["ds.system.Commit"].connect(signer);
    systems["ds.system.Move"].connect(signer);
    return network;
  }

  function bigNumToEntityID(bigNum: BigNumberish): EntityID {
    return BigNumber.from(bigNum).toHexString() as EntityID;
  }

  const getGameConfig = () => {
    const godEntityIndex = world.entityToIndex.get(GodID);
    if (godEntityIndex == null) return;

    return getComponentValue(components.GameConfig, godEntityIndex);
  };

  function getPlayerEntity(address?: string): EntityIndex | undefined {
    if (!address) address = activeNetwork().connectedAddress.get();
    if (!address) return;
    const playerEntity = world.entityToIndex.get(address as EntityID);
    if (playerEntity == null || !hasComponent(components.Player, playerEntity)) return;

    return playerEntity;
  }

  function getPhase(delay = 0): Phase | undefined {
    const time = Math.floor(activeNetwork().clock.currentTime / 1000) + delay;
    const gamePhase = getGamePhaseAt(time);
    return gamePhase;
  }

  function getGamePhaseAt(timeInSeconds: number): Phase | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const gameLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    const secondsIntoTurn = timeElapsed % gameLength;

    if (secondsIntoTurn < gameConfig.commitPhaseLength) return Phase.Commit;
    if (secondsIntoTurn < gameConfig.commitPhaseLength + gameConfig.revealPhaseLength) return Phase.Reveal;
    return Phase.Action;
  }

  function getTurn(delay = 0): number | undefined {
    const time = Math.floor(activeNetwork().clock.currentTime / 1000) + delay;
    const gameTurn = getGameTurnAt(time);
    return gameTurn;
  }

  function getGameTurnAt(timeInSeconds: number): number | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    return Math.floor(timeElapsed / turnLength);
  }

  function secondsUntilNextPhase(delay = 0) {
    const gameConfig = getGameConfig();
    const phase = getPhase(delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor(activeNetwork().clock.currentTime / 1000) + delay - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    const secondsIntoTurn = gameLength % turnLength;

    const phaseEnd =
      phase == Phase.Commit
        ? gameConfig.commitPhaseLength
        : phase == Phase.Reveal
        ? gameConfig.commitPhaseLength + gameConfig.revealPhaseLength
        : turnLength;

    return phaseEnd - secondsIntoTurn;
  }

  function getBurnerAddress() {
    if (!network) return;
    return network.connectedAddress.get();
  }

  // --- API ------------------------------------------------------------------------

  function commitMove(commitment: string) {
    const from = network?.connectedAddress.get() || ownerNetwork.connectedAddress.get();
    if (!from) return;
    systems["ds.system.Commit"].executeTyped(commitment, { from });
  }

  async function spawnPlayer(name: string, burnerPrivateKey: string | undefined) {
    const location: Coord = { x: 0, y: 0 };

    let connectedAddress;
    if (burnerPrivateKey) {
      const wallet = new Wallet(burnerPrivateKey);
      connectedAddress = wallet.address;
      network = await createBurnerNetwork(burnerPrivateKey);
      window.network.network = network;
    } else {
      ownerNetwork.connectedAddress.get();
    }
    if (!connectedAddress) return;
    console.log("hello");

    systems["ds.system.PlayerSpawn"].executeTyped(connectedAddress, name, location);
  }

  function revealMove(moves: MoveStruct[], salt: number) {
    const from = network?.connectedAddress.get() || ownerNetwork.connectedAddress.get();

    systems["ds.system.Move"].executeTyped(moves, salt, {
      gasLimit: 5_000_000,
      from,
    });
  }

  function submitActions(actions: ActionStruct[]) {
    const from = network?.connectedAddress.get() || ownerNetwork.connectedAddress.get();

    console.log("submitting actions:", actions);
    systems["ds.system.Action"].executeTyped(actions, {
      gasLimit: 10_000_000,
      from,
    });
  }

  function loadCannons() {
    const cannons = [...getComponentEntities(components.Cannon)];
    cannons.forEach((cannonEntity) =>
      systems["ds.system.ComponentDev"].executeTyped(
        keccak256("ds.component.Loaded"),
        world.entities[cannonEntity],
        abi.encode(["bool"], [true])
      )
    );
  }

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    components,
    txQueue,
    systems,
    txReduced$,
    systemCallStreams,
    startSync,
    network,
    ownerNetwork,
    utils: {
      getGameConfig,
      getPlayerEntity,
      getPhase,
      getGamePhaseAt,
      getTurn,
      secondsUntilNextPhase,
      bigNumToEntityID,
      activeNetwork,
    },
    api: { revealMove, submitActions, spawnPlayer, commitMove, loadCannons, createBurnerNetwork },
    dev: setupDevSystems(world, encoders, systems),
  };

  return context;
}
