import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "./Homepage";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "./mud";
import { NetworkProvider } from "./mud/providers/NetworkProvider";

let createNetworkLayer = createNetworkLayerImport;
export const App = ({ child }: { child: React.ReactNode }) => {
  const [network, setNetwork] = useState<NetworkLayer>();

  const { state } = useLocation();
  const { worldAddress, block } = state as { worldAddress: string | undefined; block: string | undefined };
  const startBlock = Number(block) || 0;
  async function bootGame() {
    if (!network) {
      let newNetwork = await createNetworkLayer(worldAddress, startBlock);
      newNetwork.startSync();
      setNetwork(newNetwork);
    }
  }

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept("./../mud/index.ts", async (module) => {
        console.log("reloading network");
        if (!module) return;
        createNetworkLayer = module.createNetworkLayer;
        network?.world.dispose();
        setNetwork(undefined);
        bootGame();
      });
    }
    bootGame();

    return () => {
      network?.world.dispose();
      setNetwork(undefined);
    };
  }, [worldAddress, block]);

  if (!network) return <HomePage />;
  return <NetworkProvider {...network}>{child}</NetworkProvider>;
};
