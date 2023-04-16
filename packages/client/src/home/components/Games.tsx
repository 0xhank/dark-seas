import { useEntityQuery, useObservableValue } from "@latticexyz/react";
import {
  EntityID,
  EntityIndex,
  Has,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  setComponent,
} from "@latticexyz/recs";
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
    utils: { getShipName, getPlayerShips },
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

  const activeGames = getPlayerShips().reduce((prevGames: EntityIndex[], ship) => {
    const shipGameId = getComponentValue(CurrentGame, ship)?.value;
    if (!shipGameId) return prevGames;
    const shipGameEntity = world.entityToIndex.get(shipGameId as EntityID);
    if (!shipGameEntity || prevGames.includes(shipGameEntity)) return prevGames;
    return [...prevGames, shipGameEntity];
  }, []);

  const gameButton = (game: EntityIndex) => {
    const config = getComponentValueStrict(GameConfig, game);
    const name = getShipName(game);
    const closeTime =
      Number(config.startTime) +
      config.entryCutoffTurns * (config.commitPhaseLength + config.revealPhaseLength + config.actionPhaseLength);
    const timeUntilRound = closeTime - now;
    const boats = getEntitiesWithValue(CurrentGame, { value: world.entities[game] });
    return (
      <Button key={game} onClick={() => setComponent(Page, singletonEntity, { page: "game", gameEntity: game })}>
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
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      {activeGames.length > 0 && (
        <AnotherContainer>
          <p style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }}>Games you are currently competing in</p>
          <ButtonsContainer>{activeGames.map((game) => gameButton(game))}</ButtonsContainer>
        </AnotherContainer>
      )}
      {allGames.length > 0 ? (
        <>
          <AnotherContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }}>Other live games</p>
              <div>
                <Input type="checkbox" checked={filterClosed} onChange={() => setFilterClosed(!filterClosed)} />
                <span>Filter Closed Games</span>
              </div>
            </div>
          </AnotherContainer>

          <ButtonsContainer>{games.map((game) => gameButton(game))}</ButtonsContainer>
        </>
      ) : (
        "No games played"
      )}
    </div>
  );
}
const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(2, 1fr);
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
`;

const AnotherContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
