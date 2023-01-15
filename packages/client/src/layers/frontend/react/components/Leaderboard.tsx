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
          components: { Health, Kills, OwnedBy, Ship, Name },
        },
        backend: {
          components: { LeaderboardOpen },
          godIndex,
        },
      } = layers;

      return merge(OwnedBy.update$, Health.update$, Kills.update$, LeaderboardOpen.update$).pipe(
        map(() => {
          const show = !!getComponentValue(LeaderboardOpen, godIndex)?.value;
          const close = () => {
            setComponent(LeaderboardOpen, godIndex, { value: false });
          };
          const ships: (ShipData | undefined)[] = [...getComponentEntities(Ship)].map((shipEntity) => {
            const health = getComponentValue(Health, shipEntity)?.value;
            const kills = getComponentValue(Kills, shipEntity)?.value;
            const ownerId = getComponentValue(OwnedBy, shipEntity)?.value;
            console.log(`ship: ${shipEntity}, health: ${health}, kills:${kills}, ownerId:${ownerId}`);

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

          let players: PlayerData[] = [];
          [...getComponentEntities(Ship)].forEach((shipEntity) => {
            const health = getComponentValue(Health, shipEntity)?.value;
            const kills = getComponentValue(Kills, shipEntity)?.value;
            const ownerId = getComponentValue(OwnedBy, shipEntity)?.value;
            console.log(`ship: ${shipEntity}, health: ${health}, kills:${kills}, ownerId:${ownerId}`);

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

          return {
            ships,
            players,
            show,
            close,
          };
        })
      );
    },
    ({ show, ships, players, close }) => {
      if (!show) return null;
      console.log("ships:", ships);
      return (
        <Container style={{ background: "hsla(0, 0%, 0%, .5)", zIndex: 9999 }} onClick={close}>
          <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
            <PlayerTable theadData={["Name", "Kills", "Health"]} tbodyData={players} />
            <ShipTable theadData={["Name", "Kills", "Health", "Owner"]} tbodyData={ships} />
          </LeaderboardContainer>
        </Container>
      );
    }
  );
}

const LeaderboardContainer = styled.div`
  width: 70%;
  height: 80%;
  background: hsla(0, 0%, 100%, 0.8);
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
  height: 50%;
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
      <p>Ship Leaderboard</p>

      <table>
        <thead>
          <tr>
            {theadData.map((h) => {
              return <TableHeadItem key={h} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => (a?.kills || 0) - (b?.kills || 0))
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
      <p>Player Leaderboard</p>
      <table>
        <thead>
          <tr>
            {theadData.map((h) => {
              return <TableHeadItem key={h} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => (a?.kills || 0) - (b?.kills || 0))
            .map((item) => {
              if (!item) return null;
              return <PlayerTableRow key={`item ${item.playerEntity}`} data={item} />;
            })}
        </tbody>
      </table>
    </TableContainer>
  );
};
const PlayerTableRow = ({ data }: { data: PlayerData }) => {
  return (
    <tr>
      <td>{data.name}</td>
      <td>{data.kills}</td>
      <td>{data.health}</td>
    </tr>
  );
};
