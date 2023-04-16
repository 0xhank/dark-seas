import { useEffect, useState } from "react";
import { HomePage } from "../Homepage";
import { GameProvider } from "../mud/providers/GameProvider";
import { useNetwork } from "../mud/providers/NetworkProvider";
import { createGameLayer as createGameLayerImport } from "./phaser";
import { GameWindow } from "./react/components/GameWindow";
import { SetupResult } from "./types";
let createGameLayer = createGameLayerImport;

export const Game = () => {
  const [MUD, setMUD] = useState<SetupResult>();

  const networkLayer = useNetwork();

  let gameLayer: SetupResult | undefined = undefined;

  async function bootGame() {
    if (!gameLayer) gameLayer = await createGameLayer(networkLayer);
    if (document.querySelectorAll("#phaser-game canvas").length > 1) import.meta.hot?.invalidate();
    if (!gameLayer) throw new Error("boot failed: phaser layer busted");
    setMUD(gameLayer);
  }

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept("./phaser/index.ts", async (module) => {
        console.log("reloading phaser");
        if (!module) return;
        createGameLayer = module.createGameLayer;
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
  }, []);

  if (MUD)
    return (
      <GameProvider {...MUD}>
        <GameWindow />
      </GameProvider>
    );
  return <HomePage />;
};
