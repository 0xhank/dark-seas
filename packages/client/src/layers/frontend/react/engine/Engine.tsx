import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Layers } from "../../../../types";
import { BackgroundImg } from "../styles/global";
import { MainWindow } from "./components";
import { EngineContext, LayerContext } from "./context";
import { EngineStore } from "./store";

export const Engine: React.FC<{
  setLayers: { current: (layers: Layers) => void };
  mountReact: { current: (mount: boolean) => void };
  customBootScreen?: React.ReactElement;
}> = observer(({ mountReact, setLayers, customBootScreen }) => {
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
  }, []);

  if (!mounted || !layers) return <BackgroundImg />;

  return (
    <LayerContext.Provider value={layers}>
      <EngineContext.Provider value={EngineStore}>
        <MainWindow />
      </EngineContext.Provider>
    </LayerContext.Provider>
  );
});
