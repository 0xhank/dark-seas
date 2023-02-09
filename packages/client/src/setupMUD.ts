import { EntityID, setComponent } from "@latticexyz/recs";
import { setupMUDNetwork } from "@latticexyz/std-client";

import { createFaucetService, GodID } from "@latticexyz/network";
import { createActionSystem } from "@latticexyz/std-client";
import { ethers } from "ethers";
import { SystemAbis } from "../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../contracts/types/SystemTypes";
import { commitMoveAction, respawnAction, revealMoveAction, spawnPlayerAction, submitActionsAction } from "./api";
import { clientComponents, components } from "./layers/network/components";
import { config } from "./layers/network/config";
import { createUtilities } from "./layers/network/utilties";
import { world } from "./layers/network/world";
import { Action, ModalType, Move } from "./types";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */

export type SetupResult = Awaited<ReturnType<typeof setupMUD>>;

export async function setupMUD() {
  const result = await setupMUDNetwork<typeof components, SystemTypes>(config, world, components, SystemAbis);
  const { systems, network, systemCallStreams, txReduced$ } = result;

  result.startSync();

  // For LoadingState updates
  const godEntity = world.registerEntity({ id: GodID });

  // Register player entity
  const playerAddress = result.network.connectedAddress.get();
  if (!playerAddress) throw new Error("Not connected");

  const playerEntityId = playerAddress as EntityID;
  const playerEntity = world.registerEntity({ id: playerEntityId });

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";

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
  const utils = await createUtilities(godEntity, playerEntity, playerAddress, network.clock);
  // --- API ------------------------------------------------------------------------

  function spawnPlayer(name: string, override?: boolean) {
    spawnPlayerAction(systems, actions, name, override);
  }

  function respawn(ships: EntityID[], override?: boolean) {
    respawnAction(systems, actions, ships, override);
  }

  function commitMove(moves: Move[], override?: boolean) {
    commitMoveAction(systems, actions, moves, override);
  }

  function revealMove(moves: Move[], salt: number, override?: boolean) {
    revealMoveAction(systems, actions, moves, salt, override);
  }

  function submitActions(playerActions: Action[], override?: boolean) {
    submitActionsAction(systems, actions, playerActions, override);
  }

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    systemCallStreams,
    godEntityId: GodID,
    godEntity,
    playerAddress,
    playerEntityId,
    playerEntity,
    components: {
      ...result.components,
      ...clientComponents,
    },
    api: { revealMove, submitActions, spawnPlayer, commitMove, respawn },
    utils,
    actions,
  };

  setComponent(clientComponents.ModalOpen, ModalType.BOTTOM_BAR, { value: true });

  return context;
}
