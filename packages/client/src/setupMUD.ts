import { createFaucetService, GodID } from "@latticexyz/network";
import { createPhaserEngine } from "@latticexyz/phaserx";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import { createActionSystem } from "@latticexyz/std-client";
import { ethers } from "ethers";
import { SystemAbis } from "../../contracts/types/SystemAbis.mjs";
import { SystemTypes } from "../../contracts/types/SystemTypes";
import { commitMoveAction, respawnAction, revealMoveAction, spawnPlayerAction, submitActionsAction } from "./api";
import { clientComponents, components } from "./mud/components";
import { config } from "./mud/config";
import { createUtilities } from "./mud/utilities";
import { setupDevSystems } from "./mud/utilities/setupDevSystems";
import { setupMUDNetwork } from "./mud/utilities/setupMUDNetwork";
import { world } from "./mud/world";
import { phaserConfig } from "./phaser/config";
import { createBackendSystems } from "./systems/backend/index";
import { createPhaserSystems } from "./systems/phaser/index";
import { Action, Move } from "./types";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */

export type SetupResult = Awaited<ReturnType<typeof setupMUD>>;

type mudNetwork = Awaited<ReturnType<typeof setupMUDNetwork>>;
let MUDNetwork: mudNetwork | undefined = undefined;
let phaser: Awaited<ReturnType<typeof createPhaserEngine>> | undefined = undefined;
export async function setupMUD() {
  console.info(`Booting with network config:`, config);

  async function bootGame() {
    let n = MUDNetwork;
    let p = phaser;
    if (!n)
      n = await setupMUDNetwork<typeof components, SystemTypes>(config, world, components, SystemAbis, {
        fetchSystemCalls: true,
        // initialGasPrice: 10000,
      });
    if (!p) {
      p = await createPhaserEngine(phaserConfig);
      world.registerDisposer(p.dispose);
    }
    return { n, p };
  }
  const { n, p } = await bootGame();
  MUDNetwork = n;
  phaser = p;
  if (import.meta.hot) {
    import.meta.hot.accept("./systems/phaser/index.ts", async (module) => {
      console.log("updating from module");
      world.dispose();
      phaser?.dispose();
      phaser = undefined;
      bootGame();
    });
  }
  import.meta.hot?.accept("./systems/backend/index.ts", async (module) => {
    world.dispose();
    MUDNetwork = undefined;
    await bootGame();
  });

  if (!MUDNetwork || !phaser) throw new Error("network or phaser not created properly");
  console.log("phaser: ", phaser);
  console.log("mud network:", MUDNetwork);
  const {
    systems,
    network,
    systemCallStreams,
    txReduced$,
    encoders,
    startSync,
    components: networkComponents,
  } = MUDNetwork;
  const { game, scenes } = phaser;
  startSync();

  // For LoadingState updatesk
  const godEntity = world.registerEntity({ id: GodID });

  // Register player entity
  const playerAddress = network.connectedAddress.get();
  if (!playerAddress) throw new Error("Not connected");

  // Faucet setup
  const faucetUrl = "https://faucet.testnet-mud-services.linfra.xyz";

  if (!config.devMode) {
    const faucet = createFaucetService(faucetUrl);

    const requestDrip = async () => {
      const balance = await network.signer.get()?.getBalance();
      const playerIsBroke = balance?.lte(ethers.utils.parseEther(".5"));
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

  // --- UTILITIES ------------------------------------------------------------------
  const actions = createActionSystem(world, txReduced$);
  const utils = await createUtilities(godEntity, playerAddress, network.clock, scenes.Main.phaserScene);
  // --- API ------------------------------------------------------------------------

  function spawnPlayer(name: string, ships: EntityID[], override?: boolean) {
    spawnPlayerAction(systems, actions, name, ships, override);
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
      ...networkComponents,
      ...clientComponents,
    },
    api: { revealMove, submitActions, spawnPlayer, commitMove, respawn },
    utils,
    actions,
    scene: scenes.Main,
    dev: setupDevSystems(world, encoders, systems),
  };

  (window as any).ds = context;
  createBackendSystems(context);
  createPhaserSystems(context);
  return context;
}
