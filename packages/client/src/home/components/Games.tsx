import { useEntityQuery, useObservableValue } from "@latticexyz/react";
import { EntityIndex, Has, getComponentValueStrict, getEntitiesWithValue } from "@latticexyz/recs";
import { useState } from "react";
import styled from "styled-components";
import { formatTime } from "../../game/utils/directions";
import { cap, getHash } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useHome } from "../../mud/providers/HomeProvider";
import { Input, Link } from "../../styles/global";
import { world } from "../../world";

function getGameName(gameEntity: EntityIndex) {
  const gameId = world.entities[gameEntity];

  const hash = getHash(gameId);
  const adjective = adjectives[hash % adjectives.length];
  const newHash = getHash(`${hash}`);
  const noun = nouns[newHash % nouns.length];

  const name = cap(adjective) + " " + cap(noun);
  return name;
}
export function Games() {
  const [filterClosed, setFilterClosed] = useState(true);

  const {
    components: { GameConfig, CurrentGame },
    network: { clock },
    worldAddress,
  } = useHome();

  const now = (useObservableValue(clock.time$) || 0) / 1000;
  const allGames = useEntityQuery([Has(GameConfig)]);

  const games = filterClosed
    ? allGames.filter((game) => {
        const config = getComponentValueStrict(GameConfig, game);
        const closeTime =
          Number(config.startTime) +
          config.entryCutoffTurns * (config.commitPhaseLength + config.revealPhaseLength + config.actionPhaseLength);
        return closeTime - now > 0;
      })
    : allGames;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      <div style={{ display: "flex", gap: "6px" }}>
        <Input type="checkbox" checked={filterClosed} onChange={() => setFilterClosed(!filterClosed)} />
        <span>Filter Closed Games</span>
      </div>

      <ButtonsContainer>
        {games.length > 0
          ? games.map((game) => {
              const config = getComponentValueStrict(GameConfig, game);
              const name = getGameName(game);
              const closeTime =
                Number(config.startTime) +
                config.entryCutoffTurns *
                  (config.commitPhaseLength + config.revealPhaseLength + config.actionPhaseLength);
              const timeUntilRound = closeTime - now;
              const boats = getEntitiesWithValue(CurrentGame, { value: world.entities[game] });
              return (
                <Link
                  key={game}
                  to={"/game"}
                  state={{ worldAddress, gameId: world.entities[game], block: config.startBlock }}
                >
                  {name}
                  <hr />
                  {timeUntilRound > 0 ? (
                    `Round starts in ${formatTime(timeUntilRound)}`
                  ) : (
                    <span style={{ color: "red" }}>Registration Closed</span>
                  )}
                  <hr />
                  Combatants: {[...boats].length}
                </Link>
              );
            })
          : "No games played"}
      </ButtonsContainer>
    </div>
  );
}
const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 12px;
`;
