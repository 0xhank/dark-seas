import { useEntityQuery, useObservableValue } from "@latticexyz/react";
import { Has, getComponentValueStrict, getEntitiesWithValue, setComponent } from "@latticexyz/recs";
import { useState } from "react";
import styled from "styled-components";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { Button, Input } from "../../styles/global";
import { formatTime } from "../../utils/directions";
import { world } from "../../world";

export function Games() {
  const [filterClosed, setFilterClosed] = useState(true);

  const {
    components: { GameConfig, CurrentGame, Page },
    network: { clock },
    utils: { getShipName },
    singletonEntity,
  } = useNetwork();

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
      <ButtonsContainer></ButtonsContainer>
      <ButtonsContainer>
        {games.length > 0
          ? games.map((game) => {
              const config = getComponentValueStrict(GameConfig, game);
              const name = getShipName(game);
              const closeTime =
                Number(config.startTime) +
                config.entryCutoffTurns *
                  (config.commitPhaseLength + config.revealPhaseLength + config.actionPhaseLength);
              const timeUntilRound = closeTime - now;
              const boats = getEntitiesWithValue(CurrentGame, { value: world.entities[game] });
              return (
                <Button
                  key={game}
                  onClick={() => setComponent(Page, singletonEntity, { page: "game", gameEntity: game })}
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
                </Button>
              );
            })
          : "No games played"}
      </ButtonsContainer>
    </div>
  );
}
const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(3, 1fr);
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
`;
