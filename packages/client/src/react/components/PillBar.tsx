import { EntityIndex } from "@latticexyz/recs";
import { chunk } from "lodash";
import styled from "styled-components";
import { colors } from "../styles/global";
export default function PillBar({
  maxStat,
  stat,
  key,
  title,
}: {
  stat: number;
  maxStat: number;
  key: EntityIndex | string;
  title?: string;
}) {
  let color = colors.red;
  const statPct = stat / maxStat;
  if (statPct > 0.66) {
    color = colors.green;
  } else if (statPct > 0.33) {
    color = colors.gold;
  }
  return (
    <StatContainer>
      {title && (
        <div style={{ width: "25%", textAlign: "left", textTransform: "uppercase", marginRight: "3px" }}>{title}</div>
      )}
      {chunk(Array(maxStat).fill(0), 2).map((val, idx) => {
        return (
          <div style={{ display: "flex", gap: "0", flex: 1 }} key={`hull-stat-${key}-${idx * 2}`}>
            <Stat show={idx * 2 < stat} left color={color} />
            {idx * 2 + 1 < maxStat ? <Stat show={idx * 2 + 1 < stat} color={color} /> : <div style={{ flex: 1 }} />}
          </div>
        );
      })}
    </StatContainer>
  );
}

const Stat = styled.div<{ show: boolean; left?: boolean; color: string }>`
  border-radius: ${({ left }) => (left ? "6px 0 0 6px" : "0 6px 6px 0")};
  height: 12px;
  width: 50%;
  flex: 1;
  background: ${({ show, color }) => (show ? color : "hsla(0, 0%, 0%, .25)")};
  border-right: ${({ left }) => (left ? `1px solid ${colors.tan}` : "none")};
`;

const StatContainer = styled.div`
  width: 100%;
  padding: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  @media (max-width: 1320px) {
    gap: 3px;
  }
  background: ${colors.lightTan};
  border-radius: 6px;
`;
