import { SyncState } from "@latticexyz/network";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { EntityIndex, Has, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { BootScreen } from "../../game/react/components/BootScreen";
import { cap, getHash } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useHome } from "../../mud/providers/HomeProvider";
import { BackgroundImg, Link, ShipContainer } from "../../styles/global";
import { world } from "../../world";
import { CreateGame } from "./CreateGame";
function getGameName(gameEntity: EntityIndex) {
  const gameId = world.entities[gameEntity];

  const hash = getHash(gameId);
  const adjective = adjectives[hash % adjectives.length];
  const newHash = getHash(`${hash}`);
  const noun = nouns[newHash % nouns.length];

  const name = cap(adjective) + " " + cap(noun);
  return name;
}
export function HomeWindow() {
  const {
    singletonEntity,
    worldAddress,
    components: { LoadingState, GameConfig },
  } = useHome();

  const games = useEntityQuery([Has(GameConfig)]);
  const loadingState = useComponentValue(LoadingState, singletonEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  const progression =
    loadingState.state == SyncState.INITIAL ? loadingState.percentage : loadingState.state == SyncState.LIVE ? 100 : 0;
  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={progression} />;

  return (
    <HomeContainer>
      <BackgroundImg src="img/ship-background.png" style={{ zIndex: -1 }} />
      <RegisterContainer>
        <CreateGame />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
          }}
        >
          <h1>Games</h1>
          <ButtonsContainer>
            {games.map((game) => {
              const config = getComponentValueStrict(GameConfig, game);
              const name = getGameName(game);
              return (
                <Link
                  key={game}
                  to={"/game"}
                  state={{ worldAddress, gameId: world.entities[game], block: config.startBlock }}
                >
                  {name}
                </Link>
              );
            })}
          </ButtonsContainer>
        </div>
      </RegisterContainer>
    </HomeContainer>
  );
}

const HomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 12px;
`;
const RegisterContainer = styled(ShipContainer)`
  position: absolute;
  top: 50%;
  left: 50%;
  height: 60%;
  overflow: hidden;
  transform: translate(-50%, -50%);
  padding: 12px;
  cursor: auto;
  pointer-events: all;
  display: flex;
  flex-direction: row;
`;
