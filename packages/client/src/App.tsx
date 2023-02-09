import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import { registerUIComponents } from "./layers/frontend/react/components";
import { BootScreen } from "./layers/frontend/react/engine";
import { MainWindow } from "./layers/frontend/react/engine/components";
import { EngineContext } from "./layers/frontend/react/engine/context";
import { EngineStore } from "./layers/frontend/react/engine/store";
import { useMUD } from "./MUDContext";
import { createBackendSystems } from "./systems/backend";
import { createPhaserSystems } from "./systems/phaser";

export const App = () => {
  const {
    components: { LoadingState },
    godEntity,
  } = useMUD();

  createBackendSystems();
  createPhaserSystems();
  registerUIComponents();

  const loadingState = useComponentValue(LoadingState, godEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  console.log("loadingstate:", loadingState);
  return (
    <>
      {loadingState.state !== SyncState.LIVE ? (
        <BootScreen progression={loadingState.percentage as number} />
      ) : (
        <EngineContext.Provider value={EngineStore}>
          <MainWindow />
        </EngineContext.Provider>
      )}
    </>
  );
};
