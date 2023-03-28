import { createFaucetService, SingletonID } from "@latticexyz/network";
import { EntityID, EntityIndex, namespaceWorld } from "@latticexyz/recs";
import { createActionSystem } from "@latticexyz/std-client";
import { parseEther } from "ethers/lib/utils.js";
import { SystemAbis } from "../../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import {
  commitMoveAction,
  respawnAction,
  revealMoveAction,
  spawnPlayerAction,
  submitActionsAction,
} from "../api/index";
import { Action, Move } from "../types";
import { components } from "./components";
import { getNetworkConfig } from "./config.js";
import { setupDevSystems } from "./utilities/setupDevSystems";
import { setupMUDNetwork } from "./utilities/setupMUDNetwork";
import { world } from "./world";

export async function createNetworkLayer(worldAddress?: string, block?: number) {
  const config = getNetworkConfig({ worldAddress, block });
  const networkWorld = namespaceWorld(world, "network");
  const {
    systems,
    network,
    systemCallStreams,
    txReduced$,
    encoders,
    startSync,
    components: networkComponents,
  } = await setupMUDNetwork<typeof components, SystemTypes>(config, networkWorld, components, SystemAbis, {
    fetchSystemCalls: true,
    // initialGasPrice: 10000,
  });
  // For LoadingState updates
  const godEntity = networkWorld.registerEntity({ id: SingletonID });

  // Register player entity
  const playerAddress = network.connectedAddress.get();
  if (!playerAddress) throw new Error("Not connected");

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";
  if (!config.devMode) {
    const faucet = createFaucetService(faucetUrl);

    const requestDrip = async () => {
      const balance = await network.signer.get()?.getBalance();
      const playerIsBroke = balance?.lte(parseEther(".5"));
      if (playerIsBroke) {
        console.info(`[Dev Faucet]: Player Balance -> ${balance}, dripping funds`);
        // Double drip
        playerAddress &&
          (await faucet?.dripDev({ address: playerAddress })) &&
          (await faucet?.dripDev({ address: playerAddress }));
        playerAddress &&
          (await faucet?.dripDev({ address: playerAddress })) &&
          (await faucet?.dripDev({ address: playerAddress }));
        const newBalance = await network.signer.get()?.getBalance();
        console.info(`[Dev Faucet]: Player dripped, new balance: ${newBalance}`);
      }
    };

    requestDrip();
    // Request a drip every 20 seconds
    setInterval(requestDrip, 5000);
  }
  const actions = createActionSystem(networkWorld, txReduced$);
  const api = {
    spawnPlayer: (name: string, ships: EntityID[], override?: boolean) => {
      spawnPlayerAction(systems, actions, name, ships, override);
    },

    respawn: (ships: EntityIndex[], override?: boolean) => {
      respawnAction(systems, actions, ships, override);
    },

    commitMove: (moves: Move[], override?: boolean) => {
      commitMoveAction(systems, actions, moves, override);
    },

    revealMove: (encoding: string, override?: boolean) => {
      revealMoveAction(systems, actions, encoding, override);
    },

    submitActions: (
      playerActions: Action[],
      getTargetedShips: (cannonEntity: EntityIndex) => EntityIndex[],
      override?: boolean
    ) => {
      submitActionsAction(systems, actions, getTargetedShips, playerActions, override);
    },
  };

  return {
    world: networkWorld,
    godEntity,
    godEntityId: SingletonID,
    playerAddress,
    systemCallStreams,
    components: networkComponents,
    systems,
    txReduced$,
    startSync,
    network,
    actions,
    api,
    dev: setupDevSystems(world, encoders, systems),
  };
}
