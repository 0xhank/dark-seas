import { SyncState } from "@latticexyz/network";
import { getComponentValue } from "@latticexyz/recs";
import { concat, map } from "rxjs";
import { BootScreen, registerUIComponent } from "../engine";

export function registerLoadingState() {
  registerUIComponent(
    "LoadingState",
    {
      gridRowStart: 1,
      gridRowEnd: 13,
      gridColumnStart: 1,
      gridColumnEnd: 13,
    },
    (layers) => {
      const {
        components: { LoadingState },
        world,
      } = layers.network;

      const { godEntity } = layers.backend;

      return concat([1], LoadingState.update$).pipe(
        map(() => {
          const loadingState = godEntity == null ? null : getComponentValue(LoadingState, godEntity);

          return {
            loadingState,
          };
        })
      );
    },

    // TODO: flash implies some check isnt being executed properly
    ({ loadingState }) => {
      if (loadingState?.state == SyncState.LIVE) return null;
      const progression = loadingState?.msg.includes("block number") ? 0 : loadingState?.percentage || 0;
      return (
        <BootScreen initialOpacity={1} progression={progression}>
          {loadingState?.msg}
        </BootScreen>
      );
    }
  );
}
