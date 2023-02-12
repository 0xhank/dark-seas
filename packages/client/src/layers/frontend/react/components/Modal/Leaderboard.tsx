import styled from "styled-components";
import { colors } from "../../styles/global";
import { PlayerData, ShipData } from "./Modal";

export function Leaderboard({ players, ships }: { players: PlayerData[]; ships: ShipData[] }) {
  return (
    <>
      <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
        <PlayerTable theadData={["", "", "Booty", "Health"]} tbodyData={players} />
      </LeaderboardContainer>
      <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
        <ShipTable theadData={["", "Booty", "Health", "Owner"]} tbodyData={ships} />
      </LeaderboardContainer>
    </>
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
              return <TableHeadItem key={`ship-header-${h}`} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => {
              if (!a || a.health == 0) return 1;
              if (!b || b.health == 0) return -1;

              if (a.health == 0 && b.health !== 0) return 1;
              if (a.health !== 0 && b.health == 0) return -1;

              const booty = b.booty - a.booty;
              if (booty !== 0) return booty;

              return b.health - a.health;
            })
            .map((item, i) => {
              if (!item) return null;
              return <ShipTableRow key={`ship-item-${i}`} data={item} />;
            })}
        </tbody>
      </table>
    </TableContainer>
  );
};
const ShipTableRow = ({ data }: { data: ShipData }) => {
  return (
    <tr>
      <td>{data.name}</td>
      <td>{data.booty}</td>

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
              return <TableHeadItem key={`player-header-${h}`} item={h} />;
            })}
          </tr>
        </thead>
        <tbody>
          {tbodyData
            .sort((a, b) => {
              if (!a) return 1;
              if (!b) return -1;

              if (a.health == 0 && b.health !== 0) return 1;
              if (a.health !== 0 && b.health == 0) return -1;
              const booty = b.booty - a.booty;
              if (booty !== 0) return booty;

              return b.health - a.health;
            })
            .map((item, i) => {
              if (!item) return null;
              return <PlayerTableRow key={`player-item-${item.playerEntity}`} data={item} index={i} />;
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
      <td>{data.booty}</td>
      <td>{data.health}</td>
    </tr>
  );
};