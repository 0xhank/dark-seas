import { EntityID } from "@latticexyz/recs";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "../Homepage";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "../mud";
import { NetworkProvider } from "../mud/providers/NetworkProvider";
import { PhaserProvider } from "../mud/providers/PhaserProvider";
import { Link } from "../styles/global";
import { PhaserLayer, createPhaserLayer as createPhaserLayerImport } from "./phaser";
import { GameWindow } from "./react/components/GameWindow";
import { SetupResult } from "./types";
let createNetworkLayer = createNetworkLayerImport;
let createPhaserLayer = createPhaserLayerImport;

export const Game = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const [networkLayer, setNetworkLayer] = useState<NetworkLayer>();
  const { state } = useLocation();
  const { worldAddress, gameId, block } = state as {
    worldAddress: string | undefined;
    gameId: EntityID | undefined;
    block: string | undefined;
  };

  if (!worldAddress || !ethers.utils.isAddress(worldAddress) || !gameId) throw new Error("invalid world address");
  let network: NetworkLayer | undefined = undefined;
  let phaser: PhaserLayer | undefined = undefined;

  async function bootGame() {
    if (!gameId) throw new Error("no game id");
    console.log("rebooting game");
    if (!network) {
      network = await createNetworkLayer(worldAddress, 0, gameId);
      network.startSync();
      phaser = await createPhaserLayer(network);
      setNetworkLayer(network);
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
    (window as any).ds = phaser;
  }, [worldAddress]);

  if (MUD && networkLayer)
    return (
      <NetworkProvider {...networkLayer}>
        <PhaserProvider {...MUD}>
          <div style={{ position: "fixed", top: "12px", left: "12px" }}>
            <Link
              onClick={() => {
                MUD.world.dispose();
              }}
              to="/app"
              state={{ worldAddress, block }}
            >
              Home
            </Link>
          </div>
          <GameWindow />
        </PhaserProvider>
      </NetworkProvider>
    );
  return <HomePage />;
};
