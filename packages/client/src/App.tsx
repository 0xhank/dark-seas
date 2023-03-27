import { useEffect, useState } from "react";
import { createNetworkLayer as createNetworkLayerImport, NetworkLayer } from "./mud";
import { MUDProvider } from "./mud/providers/MUDProvider";
import { createPhaserLayer as createPhaserLayerImport, PhaserLayer } from "./phaser";
import { Game } from "./react/components/Game";
import { HomePage } from "./react/Homepage/Homepage";
import { SetupResult } from "./types";
let createNetworkLayer = createNetworkLayerImport;
let createPhaserLayer = createPhaserLayerImport;

export const App = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const params = new URLSearchParams(window.location.search);
  const worldAddress = params.get("worldAddress");

  let network: NetworkLayer | undefined = undefined;
  let phaser: PhaserLayer | undefined = undefined;

  async function bootGame() {
    console.log("rebooting game");
    if (!network) {
      network = await createNetworkLayer();
      network.startSync();
      phaser = await createPhaserLayer(network);
    }
    if (!phaser) phaser = await createPhaserLayer(network);
    if (document.querySelectorAll("#phaser-game canvas").length > 1) import.meta.hot?.invalidate();
    if (!network || !phaser) throw new Error("boot failed: network or phaser layer busted");
    console.log("result:", phaser);

    setMUD(phaser);
  }

  useEffect(() => {
    if (!worldAddress) return;
    if (import.meta.hot) {
      import.meta.hot.accept("./mud/index.ts", async (module) => {
        console.log("reloading network");
        if (!module) return;
        createNetworkLayer = module.createNetworkLayer;
        network?.world.dispose();
        network = undefined;
        phaser?.world.dispose();
        phaser = undefined;
        bootGame();
      });

      import.meta.hot.accept("./phaser/index.ts", async (module) => {
        console.log("reloading phaser");
        if (!module) return;
        createPhaserLayer = module.createPhaserLayer;
        phaser?.world.dispose();
        phaser = undefined;
        bootGame();
      });
    }

    bootGame();
  }, [worldAddress]);

  if (MUD)
    return (
      <MUDProvider {...MUD}>
        <Game />
      </MUDProvider>
    );
  return <HomePage showButtons={!worldAddress} />;
};
