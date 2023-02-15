import { chunk } from "lodash";
import styled from "styled-components";
import { colors } from "../../styles/global";
export default function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  let color = colors.red;
  const healthPct = health / maxHealth;
  if (healthPct > 0.66) {
    color = colors.green;
  } else if (healthPct > 0.33) {
    color = colors.gold;
  }
  return (
    <HealthContainer>
      {chunk(Array(maxHealth).fill(0), 2).map((val, idx) => {
        return (
          <p style={{ display: "flex", gap: "0", flex: 1 }}>
            <Health key={`hull-health-${idx * 2}`} show={idx * 2 <= health} left color={color} />
            {idx * 2 + 1 < maxHealth ? (
              <Health key={`hull-health-${idx * 2 + 1}`} show={idx * 2 + 1 <= health} color={color} />
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </p>
        );
      })}
    </HealthContainer>
  );
}

const Health = styled.div<{ show: boolean; left?: boolean; color: string }>`
  border-radius: ${({ left }) => (left ? "6px 0 0 6px" : "0 6px 6px 0")};
  height: 12px;
  width: 50%;
  flex: 1;
  background: ${({ show, color }) => (show ? color : "hsla(0, 0%, 0%, .25)")};
`;

const HealthContainer = styled.div`
  width: 100%;
  padding: 2px;
  display: flex;
  justify-content: center;
  gap: 5px;
  @media (max-width: 1320px) {
    gap: 3px;
  }
  background: ${colors.lightTan};
  border-radius: 6px;
`;
