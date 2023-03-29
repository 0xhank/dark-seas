import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import { BootScreen } from "../../game/react/components/BootScreen";
import { colors } from "../../game/react/styles/global";
import { useHome } from "../../mud/providers/HomeProvider";

export function HomeWindow() {
  const {
    components: { LoadingState },
    godEntity,
  } = useHome();

  const loadingState = useComponentValue(LoadingState, godEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  const progression =
    loadingState.state == SyncState.INITIAL ? loadingState.percentage : loadingState.state == SyncState.LIVE ? 100 : 0;
  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={progression} />;

  return (
    <div style={{ background: colors.blue }}>
      <h1>Home</h1>
    </div>
  );
}
