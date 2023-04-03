import { SyncState } from "@latticexyz/network";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Has, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { BootScreen } from "../../game/react/components/BootScreen";
import { useHome } from "../../mud/providers/HomeProvider";
import { Button, Link, colors } from "../../styles/global";
import { world } from "../../world";

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
    <HomeContainer>
      <h1>Games</h1>
      <ButtonsContainer>
        {games.map((game) => {
          const config = getComponentValueStrict(GameConfig, game);
          return (
            <Link key={game} to={"/game"} state={{ worldAddress: world.entities[game], block: config.startBlock }}>
              Game {game}
            </Link>
          );
        })}
      </ButtonsContainer>
      <Button
        secondary
        onClick={() => {
          createGame({
            startTime: 0,
            startBlock: 0,
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
        style={{ width: "100px" }}
      >
        Create Game
      </Button>
    </HomeContainer>
  );
}

const HomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: ${colors.blue};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
`;
