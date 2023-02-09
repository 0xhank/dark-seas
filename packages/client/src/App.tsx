import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import { BootScreen } from "./layers/frontend/react/engine";
import { useMUD } from "./MUDContext";

export const App = () => {
  const {
    components: { LoadingState },
    godEntity,
  } = useMUD();

  const loadingState = useComponentValue(LoadingState, godEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  return (
    <>{loadingState.state !== SyncState.LIVE ? <BootScreen progression={loadingState.percentage as number} /> : null}</>
  );
};
