import { SyncState } from "@latticexyz/network";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Has } from "@latticexyz/recs";
import { BootScreen } from "../../game/react/components/BootScreen";
import { Button, colors } from "../../game/react/styles/global";
import { useHome } from "../../mud/providers/HomeProvider";

export function HomeWindow() {
  const {
    components: { LoadingState, GameConfig },
    api: { createGame },
    godEntity,
  } = useHome();

  const games = useEntityQuery([Has(GameConfig)]);
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
      <Button
        onClick={() => {
          createGame({
            startTime: 0,
            commitPhaseLength: 25,
            revealPhaseLength: 9,
            actionPhaseLength: 25,
            worldSize: 90,
            perlinSeed: 345676,
            entryCutoffTurns: 3,
            buyin: 0,
            shrinkRate: 400,
            budget: 6,
            islandThreshold: 33,
          });
        }}
      >
        Create Game
      </Button>
      {games.map((game) => {
        return <Button key={game}>{game}</Button>;
      })}
    </div>
  );
}
