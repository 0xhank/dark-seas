import { EntityID } from "@latticexyz/recs";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { HomePage } from "../Homepage";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "../mud";
import { NetworkProvider } from "../mud/providers/NetworkProvider";
import { PhaserProvider } from "../mud/providers/PhaserProvider";
import { PhaserLayer, createPhaserLayer as createPhaserLayerImport } from "./phaser";
import { GameWindow } from "./react/components/GameWindow";
import { SetupResult } from "./types";
let createNetworkLayer = createNetworkLayerImport;
let createPhaserLayer = createPhaserLayerImport;

export const Game = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const [networkLayer, setNetworkLayer] = useState<NetworkLayer>();
  const { state } = useLocation();
  const { worldAddress: paramsWorldAddress } = useParams();
  const {
    worldAddress: stateWorldAddress,
    gameId,
    block,
  } = state as {
    worldAddress: string | undefined;
    gameId: EntityID | undefined;
    block: string | undefined;
  };

  const worldAddress = paramsWorldAddress || stateWorldAddress;
  if (!worldAddress || !ethers.utils.isAddress(worldAddress) || !gameId) throw new Error("invalid world address");
  let network: NetworkLayer | undefined = undefined;
  let phaser: PhaserLayer | undefined = undefined;

  async function bootGame() {
    if (!gameId) throw new Error("no game id");
    if (!network) {
      console.log("creating network");
      network = await createNetworkLayer(worldAddress, block ? Number(block) : undefined, gameId);
      network.startSync();
      phaser = await createPhaserLayer(network);
      setNetworkLayer(network);
    }
    if (!phaser) phaser = await createPhaserLayer(network);
    if (document.querySelectorAll("#phaser-game canvas").length > 1) import.meta.hot?.invalidate();
    if (!network || !phaser) throw new Error("boot failed: network or phaser layer busted");

    setMUD(phaser);
  }

  useEffect(() => {
    console.log("booting");
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
    return () => {
      network?.world.dispose();
      network = undefined;
      phaser?.world.dispose();
      phaser = undefined;
    };
  }, [worldAddress]);

  if (MUD && networkLayer)
    return (
      <NetworkProvider {...networkLayer}>
        <PhaserProvider {...MUD}>
          <GameWindow />
        </PhaserProvider>
      </NetworkProvider>
    );
  return <HomePage />;
};
