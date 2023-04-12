import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "../Homepage";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "../mud";
import { NetworkProvider } from "../mud/providers/NetworkProvider";
import { HomeWindow } from "./components/HomeWindow";

let createNetworkLayer = createNetworkLayerImport;
export const Home = () => {
  const [MUD, setMUD] = useState<NetworkLayer>();
  const { state } = useLocation();
  const { worldAddress, block } = state as { worldAddress: string | undefined; block: string | undefined };
  const startBlock = Number(block) || 0;
  let network: NetworkLayer | undefined = undefined;

  async function bootGame() {
    if (!network) {
      network = await createNetworkLayer(worldAddress, startBlock);
      network.startSync();
      setMUD(network);
    }
  }

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept("./../mud/index.ts", async (module) => {
        console.log("reloading network");
        if (!module) return;
        createNetworkLayer = module.createNetworkLayer;
        network?.world.dispose();
        network = undefined;
        bootGame();
      });
    }
    bootGame();

    return () => {
      network?.world.dispose();
      network = undefined;
    };
  }, [worldAddress, block]);
  if (!MUD) return <HomePage />;
  return (
    <NetworkProvider {...MUD}>
      <HomeWindow />
    </NetworkProvider>
  );
};
