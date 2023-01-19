import { EntityIndex, getComponentEntities, getComponentValue, setComponent } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../engine";
import { colors, Container } from "../styles/global";

type ShipData = {
  shipEntity: EntityIndex;
  health: number;
  kills: number;
  owner: string;
};

type PlayerData = {
  playerEntity: EntityIndex;
  name: string;
  health: number;
  kills: number;
};
export function registerLeaderboard() {
  registerUIComponent(
    "Leaderboard",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          world,
          components: { Kills, OwnedBy, Ship, Name },
        },
        backend: {
          components: { LeaderboardOpen, LocalHealth },
          godIndex,
        },
      } = layers;

      return merge(OwnedBy.update$, LocalHealth.update$, Kills.update$, LeaderboardOpen.update$).pipe(
        map(() => {
          const show = !!getComponentValue(LeaderboardOpen, godIndex)?.value;
          const close = () => {
            setComponent(LeaderboardOpen, godIndex, { value: false });
          };
          const getShips = () =>
            [...getComponentEntities(Ship)].map((shipEntity) => {
              const health = getComponentValue(LocalHealth, shipEntity)?.value;
              const kills = getComponentValue(Kills, shipEntity)?.value;
              const ownerId = getComponentValue(OwnedBy, shipEntity)?.value;

              if (!ownerId) return;
              const owner = world.entityToIndex.get(ownerId);
              if (!owner) return;
              const name = getComponentValue(Name, owner)?.value;
              if (health == undefined || kills == undefined || name == undefined) return;
              return {
                shipEntity,
                health,
                kills,
                owner: name,
              };
            });

          const getPlayers = () => {
            let players: PlayerData[] = [];
            [...getComponentEntities(Ship)].forEach((shipEntity) => {
              const health = getComponentValue(LocalHealth, shipEntity)?.value;
              const kills = getComponentValue(Kills, shipEntity)?.value;
              const ownerId = getComponentValue(OwnedBy, shipEntity)?.value;

              if (!ownerId) return;
              const owner = world.entityToIndex.get(ownerId);
              if (!owner) return;
              const name = getComponentValue(Name, owner)?.value;
              if (health == undefined || kills == undefined || name == undefined) return;

              const player = players.find((player) => player.playerEntity == owner);

              if (!player) {
                players.push({
                  playerEntity: owner,
                  name,
                  health,
                  kills,
                });
              } else {
                player.health += health;
                player.kills += kills;
              }
            });
            return players;
          };

          return {
            getShips,
            getPlayers,
            show,
            close,
          };
        })
      );
    },
    ({ show, getShips, getPlayers, close }) => {
      if (!show) return null;
      const ships = getShips();
      const players = getPlayers();
      return (
        <Container
          style={{ flexDirection: "row", background: "hsla(0, 0%, 0%, 0.6", zIndex: 9999, gap: "20px" }}
          onClick={close}
          onMouseEnter={(e) => e.stopPropagation()}
        >
          <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
            <PlayerTable theadData={["Rank", "Name", "Kills", "Health"]} tbodyData={players} />
          </LeaderboardContainer>
          <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
            <ShipTable theadData={["ID", "Kills", "Health", "Owner"]} tbodyData={ships} />
          </LeaderboardContainer>
        </Container>
      );
    }
  );
}

const LeaderboardContainer = styled.div`
  height: 80%;
  min-width: 20%;
  background: whitesmoke;
  border: 5px solid ${colors.gold};

  color: ${colors.darkBrown};
  border-radius: 20px;
  padding: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
`;

const TableContainer = styled.div`
  overflow-y: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TableHeadItem = ({ item }: { item: string }) => {
  return <td title={item}>{item}</td>;
};

const ShipTable = ({ theadData, tbodyData }: { theadData: string[]; tbodyData: (ShipData | undefined)[] }) => {
  return (
    <TableContainer>
      <p style={{ fontSize: "2rem" }}>Ship Leaderboard</p>

      <table style={{ textAlign: "center", color: colors.darkBrown }}>
        <thead>
          <tr>
            {theadData.map((h) => {
              return <TableHeadItem key={h} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => {
              if (!a) return 1;
              if (!b) return -1;

              const kills = b.kills - a.kills;
              if (kills !== 0) return kills;

              return b.health - a.health;
            })
            .map((item) => {
              if (!item) return null;
              return <ShipTableRow key={`item ${item.shipEntity}`} data={item} />;
            })}
        </tbody>
      </table>
    </TableContainer>
  );
};
const ShipTableRow = ({ data }: { data: ShipData }) => {
  return (
    <tr>
      <td>{data.shipEntity}</td>
      <td>{data.kills}</td>
      <td>{data.health}</td>
      <td>{data.owner}</td>
    </tr>
  );
};

const PlayerTable = ({ theadData, tbodyData }: { theadData: string[]; tbodyData: (PlayerData | undefined)[] }) => {
  return (
    <TableContainer>
      <p style={{ fontSize: "2rem" }}>Player Leaderboard</p>
      <table style={{ textAlign: "center", color: colors.darkBrown }}>
        <thead>
          <tr>
            {theadData.map((h) => {
              return <TableHeadItem key={h} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => {
              if (!a) return 1;
              if (!b) return -1;

              const kills = b.kills - a.kills;
              if (kills !== 0) return kills;

              return b.health - a.health;
            })
            .map((item, i) => {
              if (!item) return null;
              return <PlayerTableRow key={`item ${item.playerEntity}`} data={item} index={i} />;
            })}
        </tbody>
      </table>
    </TableContainer>
  );
};
const PlayerTableRow = ({ data, index }: { data: PlayerData; index: number }) => {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>{data.name}</td>
      <td>{data.kills}</td>
      <td>{data.health}</td>
    </tr>
  );
};
