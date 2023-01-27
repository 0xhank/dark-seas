import { SyncState } from "@latticexyz/network";
import { getComponentValue } from "@latticexyz/recs";
import { concat, map } from "rxjs";
import { BootScreen, registerUIComponent } from "../engine";

export function registerLoadingState() {
  registerUIComponent(
    "LoadingState",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
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
      if (loadingState == null) {
        return <BootScreen initialOpacity={1}>Connecting</BootScreen>;
      }

      if (loadingState.state !== SyncState.LIVE) {
        return <BootScreen initialOpacity={1}>{loadingState.msg}</BootScreen>;
      }

      return null;
    }
  );
}
