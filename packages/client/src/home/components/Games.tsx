import { useEntityQuery } from "@latticexyz/react";
import { EntityIndex, Has, getComponentValueStrict, getEntitiesWithValue } from "@latticexyz/recs";
import styled from "styled-components";
import { cap, getHash } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useHome } from "../../mud/providers/HomeProvider";
import { Link } from "../../styles/global";
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
  const {
    components: { GameConfig, CurrentGame },
    worldAddress,
  } = useHome();

  const games = useEntityQuery([Has(GameConfig)]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      <ButtonsContainer>
        {games.length > 0
          ? games.map((game) => {
              const config = getComponentValueStrict(GameConfig, game);
              const name = getGameName(game);
              const date = new Date(Number(config.startTime) * 1000);
              const boats = getEntitiesWithValue(CurrentGame, { value: world.entities[game] });
              return (
                <Link
                  key={game}
                  to={"/game"}
                  state={{ worldAddress, gameId: world.entities[game], block: config.startBlock }}
                >
                  Name: {name}
                  <hr />
                  Start time: {`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}
                  <hr />
                  Combatants: {[...boats].length}
                  <hr />
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
