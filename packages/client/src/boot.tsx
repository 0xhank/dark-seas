/* eslint-disable @typescript-eslint/no-explicit-any */
import { getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import { Wallet } from "ethers";
import ReactDOM from "react-dom/client";
import { createBackendLayer as createBackendLayerImport } from "./layers/backend";
import { createPhaserLayer as createPhaserLayerImport } from "./layers/frontend/phaser";
import { registerUIComponents as registerUIComponentsImport } from "./layers/frontend/react/components";
import { Engine as EngineImport } from "./layers/frontend/react/engine/Engine";
import { createNetworkLayer as createNetworkLayerImport } from "./layers/network";
import { GameConfig } from "./layers/network/config";
import { Layers } from "./types";
import { Time } from "./utils/time";

// Assign variables that can be overridden by HMR
let createNetworkLayer = createNetworkLayerImport;
let createBackendLayer = createBackendLayerImport;
let createPhaserLayer = createPhaserLayerImport;
let registerUIComponents = registerUIComponentsImport;
let Engine = EngineImport;

/**
 * This function is called once when the game boots up.
 * It creates all the layers and their hierarchy.
 * Add new layers here.
 */
async function bootGame() {
  const layers: Partial<Layers> = {};
  let initialBoot = true;

  async function rebootGame(): Promise<Layers> {
    // Remove react when starting to reboot layers, reboot react once layers are rebooted
    mountReact.current(false);

    const params = new URLSearchParams(window.location.search);
    const worldAddress = params.get("worldAddress");
    let privateKey = params.get("privateKey");
    const chainId = Number(params.get("chainId")) || 31337;
    const jsonRpc = params.get("rpc") ?? "http://localhost:8545";
    const wsRpc = params.get("wsRpc") ?? "ws://localhost:8545";
    const checkpointUrl = params.get("checkpoint") || undefined;
    const devMode = params.get("dev") === "true";
    const initialBlockNumber = Number(params.get("initialBlockNumber")) || 0;
    let burnerPrivateKey = params.get("burnerWalletPrivateKey");
    if (!privateKey) {
      privateKey = localStorage.getItem("playerWallet") || Wallet.createRandom().privateKey;
      // privateKey = Wallet.createRandom().privateKey;
      localStorage.setItem("playerWallet", privateKey);
    }
    if (!burnerPrivateKey) {
      burnerPrivateKey = localStorage.getItem(`burnerWallet-${worldAddress}`);
    }

    let networkLayerConfig: GameConfig | undefined;
    if (worldAddress && privateKey && chainId && jsonRpc) {
      networkLayerConfig = {
        worldAddress,
        privateKey,
        chainId,
        jsonRpc,
        wsRpc,
        checkpointUrl,
        devMode,
        initialBlockNumber,
        burnerPrivateKey,
      };
    }

    if (!networkLayerConfig) throw new Error("Invalid config");

    if (!layers.network) layers.network = await createNetworkLayer(networkLayerConfig);
    if (!layers.backend) layers.backend = await createBackendLayer(layers.network);
    if (!layers.phaser) layers.phaser = await createPhaserLayer(layers.backend);

    (window as any).network = layers.network;
    // Sync global time with phaser clock
    Time.time.setPacemaker((setTimestamp) => {
      layers.phaser?.game.events.on("poststep", (time: number) => {
        setTimestamp(time);
      });
    });

    // Make sure there is only one canvas.
    // Ideally HMR should handle this, but in some cases it fails.
    // If there are two canvas elements, do a full reload.
    if (document.querySelectorAll("#phaser-game canvas").length > 1) {
      console.log("Detected two canvas elements, full reload");
      import.meta.hot?.invalidate();
    }

    // Start syncing once all systems have booted
    if (initialBoot) {
      initialBoot = false;
      layers.network.startSync();
    }

    // Reboot react if layers have changed
    mountReact.current(true);

    return layers as Layers;
  }

  function dispose(layer: keyof Layers) {
    layers[layer]?.world.dispose();
    layers[layer] = undefined;
  }

  await rebootGame();

  const ecs = {
    setComponent,
    removeComponent,
    getComponentValue,
  };

  (window as any).layers = layers;
  (window as any).ecs = ecs;
  (window as any).time = Time.time;

  let reloadingNetwork = false;
  let reloadingPhaser = false;

  if (import.meta.hot) {
    import.meta.hot.accept("./layers/network/index.ts", async (module) => {
      if (reloadingNetwork) return;
      reloadingNetwork = true;
      createNetworkLayer = module.createNetworkLayer;
      dispose("network");
      dispose("phaser");
      await rebootGame();
      console.log("HMR Network");
      layers.network?.startSync();
      reloadingNetwork = false;
    });

    import.meta.hot.accept("./layers/phaser/index.ts", async (module) => {
      if (reloadingPhaser) return;
      reloadingPhaser = true;
      createPhaserLayer = module.createPhaserLayer;
      dispose("phaser");
      await rebootGame();
      console.log("HMR Phaser");
      reloadingPhaser = false;
    });
  }
  console.log("booted");

  return { layers, ecs };
}

const mountReact: { current: (mount: boolean) => void } = { current: () => void 0 };
const setLayers: { current: (layers: Layers) => void } = { current: () => void 0 };

function bootReact() {
  const rootElement = document.getElementById("react-root");
  if (!rootElement) return console.warn("React root not found");

  const root = ReactDOM.createRoot(rootElement);

  function renderEngine() {
    root.render(<Engine setLayers={setLayers} mountReact={mountReact} />);
  }

  renderEngine();
  registerUIComponents();

  if (import.meta.hot) {
    // HMR React engine
    import.meta.hot.accept("./layers/Renderer/React/engine/Engine.tsx", async (module) => {
      Engine = module.Engine;
      renderEngine();
    });
  }

  if (import.meta.hot) {
    // HMR React components
    import.meta.hot.accept("./layers/Renderer/React/components/index.ts", async (module) => {
      registerUIComponents = module.registerUIComponents;
      registerUIComponents();
    });
  }
}

export async function boot() {
  bootReact();
  const game = await bootGame();
  setLayers.current(game.layers as Layers);
}
