import { createFaucetService, SingletonID } from "@latticexyz/network";
import { EntityIndex, namespaceWorld } from "@latticexyz/recs";
import { createActionSystem } from "@latticexyz/std-client";
import { parseEther } from "ethers/lib/utils.js";
import { GameConfigStruct } from "../../../contracts/types/ethers-contracts/CreateGameSystem.js";
import { SystemAbis } from "../../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import {
  commitMoveAction,
  createGameAction,
  extractShipAction,
  joinGameAction,
  purchaseShipAction,
  revealMoveAction,
  spawnAction,
  submitActionsAction,
} from "../api/index";
import { clientComponents, components } from "../components";
import { Action, Move } from "../game/types.js";
import { world } from "../world";
import { networkConfig } from "./config.js";
import { createAppUtilities } from "./utils/appUtils.js";
import { setupDevSystems } from "./utils/setupDevSystems";
import { setupMUDNetwork } from "./utils/setupMUDNetwork";
export async function createNetworkLayer() {
  const networkWorld = namespaceWorld(world, "network");
  const {
    systems,
    network,
    systemCallStreams,
    txReduced$,
    encoders,
    startSync,
    components: networkComponents,
  } = await setupMUDNetwork<typeof components, SystemTypes>(networkConfig, world, components, SystemAbis, {
    fetchSystemCalls: true,
    // initialGasPrice: 10000,
  });
  // For LoadingState updates
  const singletonEntity = world.registerEntity({ id: SingletonID });

  // Register player entity
  const ownerAddress = network.connectedAddress.get();
  if (!ownerAddress) throw new Error("Not connected");

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";
  if (!networkConfig.devMode) {
    const faucet = createFaucetService(faucetUrl);

    const requestDrip = async () => {
      const balance = await network.signer.get()?.getBalance();
      const playerIsBroke = balance?.lte(parseEther(".5"));
      if (playerIsBroke) {
        console.info(`[Dev Faucet]: Player Balance -> ${balance}, dripping funds`);
        // Double drip
        ownerAddress &&
          (await faucet?.dripDev({ address: ownerAddress })) &&
          (await faucet?.dripDev({ address: ownerAddress }));
        ownerAddress &&
          (await faucet?.dripDev({ address: ownerAddress })) &&
          (await faucet?.dripDev({ address: ownerAddress }));
        const newBalance = await network.signer.get()?.getBalance();
        console.info(`[Dev Faucet]: Player dripped, new balance: ${newBalance}`);
      }
    };

    requestDrip();
    // Request a drip every 20 seconds
    setInterval(requestDrip, 5000);
  }

  const utils = createAppUtilities(ownerAddress);
  const actions = createActionSystem(world, txReduced$);
  const api = {
    spawn: (name: string, override?: boolean) => {
      spawnAction(systems, actions, name, override);
    },
    joinGame: (gameEntity: EntityIndex, ships: EntityIndex[], override?: boolean) => {
      joinGameAction(gameEntity, systems, actions, ships, override);
    },

    commitMove: (gameEntity: EntityIndex, moves: Move[], override?: boolean) => {
      commitMoveAction(gameEntity, systems, actions, moves, override);
    },

    revealMove: (encoding: string, override?: boolean) => {
      revealMoveAction(systems, actions, encoding, override);
    },

    submitActions: (
      gameEntity: EntityIndex,
      playerActions: Action[],
      getTargetedShips: (cannonEntity: EntityIndex) => EntityIndex[],
      override?: boolean
    ) => {
      submitActionsAction(gameEntity, systems, actions, getTargetedShips, playerActions, override);
    },

    createGame: (gameConfig: GameConfigStruct, override?: boolean) => {
      createGameAction(systems, actions, gameConfig, override);
    },

    purchaseShip: (shipEntity: EntityIndex, override?: boolean) => {
      purchaseShipAction(systems, actions, shipEntity, override);
    },
    extractShip: (shipEntity: EntityIndex, override?: boolean) => {
      extractShipAction(systems, actions, shipEntity, override);
    },
    bulkExtract: (shipEntities: EntityIndex[], override?: boolean) => {
      extractShipAction(systems, actions, shipEntities, override);
    },
  };

  const context = {
    world,
    worldAddress: networkConfig.worldAddress,
    startingBlock: networkConfig.initialBlockNumber,
    singletonEntity,
    ownerAddress,
    systemCallStreams,
    components: { ...networkComponents, ...clientComponents },
    systems,
    txReduced$,
    utils,
    startSync,
    network,
    actions,
    api,
    dev: setupDevSystems(world, encoders, systems),
  };

  (window as any).network = context;
  return context;
}