import { EntityID } from "@latticexyz/recs";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useNetwork } from "../mud/providers/NetworkProvider";
import { PhaserProvider } from "../mud/providers/PhaserProvider";
import { createPhaserLayer as createPhaserLayerImport } from "./phaser";
import { GameWindow } from "./react/components/GameWindow";
import { SetupResult } from "./types";
let createPhaserLayer = createPhaserLayerImport;

export const Game = () => {
  const [MUD, setMUD] = useState<SetupResult>();

  const networkLayer = useNetwork();
  const { state } = useLocation();
  const { worldAddress: paramsWorldAddress } = useParams();
  const { worldAddress: stateWorldAddress, gameId } = state as {
    worldAddress: string | undefined;
    gameId: EntityID | undefined;
  };

  const worldAddress = paramsWorldAddress || stateWorldAddress;
  if (!worldAddress || !ethers.utils.isAddress(worldAddress) || !gameId) throw new Error("invalid world address");

  let phaserLayer: SetupResult | undefined = undefined;

  async function bootGame() {
    if (!gameId) throw new Error("no game id");
    if (!phaserLayer) phaserLayer = await createPhaserLayer(networkLayer);
    if (document.querySelectorAll("#phaser-game canvas").length > 1) import.meta.hot?.invalidate();
    if (!phaserLayer) throw new Error("boot failed: phaser layer busted");
    setMUD(phaserLayer);
  }

  useEffect(() => {
    if (!worldAddress) return;
    if (import.meta.hot) {
      import.meta.hot.accept("./phaser/index.ts", async (module) => {
        console.log("reloading phaser");
        if (!module) return;
        createPhaserLayer = module.createPhaserLayer;
        MUD?.world.dispose();
        setMUD(undefined);
        bootGame();
      });
    }

    bootGame();
    return () => {
      MUD?.world.dispose();
      setMUD(undefined);
    };
  }, [worldAddress]);
  console.log("mud: ", MUD);

  if (MUD)
    return (
      <PhaserProvider {...MUD}>
        <GameWindow />
      </PhaserProvider>
    );
  return <>hello</>;
};
