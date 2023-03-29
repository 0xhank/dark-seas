import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "../Homepage";
import { createNetworkLayer as createNetworkLayerImport, NetworkLayer } from "../mud";
import { HomeProvider } from "../mud/providers/HomeProvider";
import { HomeWindow } from "./components/HomeWindow";

let createNetworkLayer = createNetworkLayerImport;
export const Home = () => {
  const [MUD, setMUD] = useState<NetworkLayer>();
  const { state } = useLocation();
  const { worldAddress, block } = state as { worldAddress: string | undefined; block: string | undefined };
  console.log("home", worldAddress, block);
  let network: NetworkLayer | undefined = undefined;
  async function bootGame() {
    if (!network) {
      network = await createNetworkLayer(worldAddress, Number(block));
      network.startSync();
      setMUD(network);
    }
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
        bootGame();
      });
    }
    bootGame();
  }, [worldAddress, block]);
  if (!MUD) return <HomePage />;
  return (
    <HomeProvider {...MUD}>
      <HomeWindow />
    </HomeProvider>
  );
};
