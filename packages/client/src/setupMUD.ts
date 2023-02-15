import { EntityIndex } from "@latticexyz/recs";
import { setupMUDNetwork } from "@latticexyz/std-client";

import { createFaucetService, GodID } from "@latticexyz/network";
import { createPhaserEngine } from "@latticexyz/phaserx";
import { createActionSystem } from "@latticexyz/std-client";
import { ethers } from "ethers";
import { SystemAbis } from "../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../contracts/types/SystemTypes";
import { commitMoveAction, respawnAction, revealMoveAction, spawnPlayerAction, submitActionsAction } from "./api";
import { clientComponents, components } from "./mud/components";
import { config } from "./mud/config";
import { createUtilities } from "./mud/utilities";
import { setupDevSystems } from "./mud/utilities/setupDevSystems";
import { world } from "./mud/world";
import { phaserConfig } from "./phaser/config";
import { Action, Move } from "./types";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */

export type SetupResult = Awaited<ReturnType<typeof setupMUD>>;

export async function setupMUD() {
  const res = await setupMUDNetwork<typeof components, SystemTypes>(config, world, components, SystemAbis, {
    fetchSystemCalls: true,
  });
  const { systems, network, systemCallStreams, txReduced$, encoders } = res;
  res.startSync();

  // For LoadingState updates
  const godEntity = world.registerEntity({ id: GodID });

  // Register player entity
  const playerAddress = res.network.connectedAddress.get();
  if (!playerAddress) throw new Error("Not connected");

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";

  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  if (!config.devMode) {
    const faucet = createFaucetService(faucetUrl);
    const address = network.connectedAddress.get();
    console.info("[Dev Faucet]: Player Address -> ", address);

    const requestDrip = async () => {
      const balance = await network.signer.get()?.getBalance();
      console.info(`[Dev Faucet]: Player Balance -> ${balance}`);
      const playerIsBroke = balance?.lte(ethers.utils.parseEther(".5"));
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

  const actions = createActionSystem(world, txReduced$);
  const utils = await createUtilities(godEntity, playerAddress, network.clock, scenes.Main.phaserScene);
  // --- API ------------------------------------------------------------------------

  function spawnPlayer(name: string, override?: boolean) {
    spawnPlayerAction(systems, actions, name, override);
  }

  function respawn(ships: EntityIndex[], override?: boolean) {
    respawnAction(systems, actions, ships, override);
  }

  function commitMove(moves: Move[], override?: boolean) {
    commitMoveAction(systems, actions, moves, override);
  }

  function revealMove(encoding: string, override?: boolean) {
    revealMoveAction(systems, actions, encoding, override);
  }

  function submitActions(playerActions: Action[], override?: boolean) {
    submitActionsAction(systems, actions, utils.getTargetedShips, playerActions, override);
  }

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    systemCallStreams,
    godEntityId: GodID,
    godEntity,
    playerAddress,
    network,
    components: {
      ...res.components,
      ...clientComponents,
    },
    api: { revealMove, submitActions, spawnPlayer, commitMove, respawn },
    utils,
    actions,
    scene: scenes.Main,
    dev: setupDevSystems(world, encoders, systems),
  };

  return context;
}
