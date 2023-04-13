import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HomePage } from "./Homepage";
import { Game } from "./game/Game";
import { BootScreen } from "./game/react/components/BootScreen";
import { HomeWindow } from "./home/components/HomeWindow";
import { NetworkLayer, createNetworkLayer as createNetworkLayerImport } from "./mud";
import { NetworkProvider, useNetwork } from "./mud/providers/NetworkProvider";

let createNetworkLayer = createNetworkLayerImport;
export const App = () => {
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
  return (
    <NetworkProvider {...network}>
      <AppWindow />
    </NetworkProvider>
  );
};

type PageType = "home" | "game";

const AppWindow = () => {
  const {
    singletonEntity,
    components: { LoadingState, Page },
  } = useNetwork();

  const loadingState = useComponentValue(LoadingState, singletonEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  const progression =
    loadingState.state == SyncState.INITIAL ? loadingState.percentage : loadingState.state == SyncState.LIVE ? 100 : 0;

  const currentPage = useComponentValue(Page, singletonEntity, { page: "home", gameEntity: singletonEntity }).page;

  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={progression} />;

  return currentPage == "home" ? <HomeWindow /> : <Game />;
};
