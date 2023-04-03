import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "../Homepage";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "../mud";
import { GameProvider } from "../mud/providers/GameProvider";
import { PhaserLayer, createPhaserLayer as createPhaserLayerImport } from "./phaser";
import { GameWindow } from "./react/components/GameWindow";
import { SetupResult } from "./types";
let createNetworkLayer = createNetworkLayerImport;
let createPhaserLayer = createPhaserLayerImport;

export const Game = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const { state } = useLocation();
  const { worldAddress, block } = state as { worldAddress: string | undefined };
  console.log(worldAddress, block);
  if (!worldAddress || !ethers.utils.isAddress(worldAddress)) throw new Error("invalid world address");
  let network: NetworkLayer | undefined = undefined;
  let phaser: PhaserLayer | undefined = undefined;

  async function bootGame() {
    console.log("rebooting game");
    if (!network) {
      network = await createNetworkLayer(worldAddress, Number(block ? block : 0));
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
      import.meta.hot.accept("./../mud/index.ts", async (module) => {
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
      <GameProvider {...MUD}>
        <GameWindow />
      </GameProvider>
    );
  return <HomePage />;
};
