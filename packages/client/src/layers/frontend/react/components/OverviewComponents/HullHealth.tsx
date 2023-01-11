import styled from "styled-components";
import { colors, Container } from "../../styles/global";

export default function HullHealth({ health, maxHealth }: { health: number; maxHealth: number }) {
  return (
    <HealthContainer>
      <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "1rem" }}>hull</span>
      <HealthBars>
        {Array(maxHealth)
          .fill(0)
          .map((val, idx) => {
            return (
              <div
                style={{ height: "100%", flex: 1, background: idx + 1 <= health ? colors.lightBrown : "transparent" }}
                key={`hull-health-${idx}`}
              />
            );
          })}
      </HealthBars>
    </HealthContainer>
  );
}

const HealthBars = styled.span`
  display: flex;
  gap: 5px;
  width: 100%;
  height: 100%;
  @media (max-width: 1320px) {
    gap: 3px;
  }
`;
const HealthContainer = styled(Container)`
  background: ${colors.thickGlass};
  height: 4.5rem;
  width: 100%;
  color: ${colors.darkBrown};
  border: 1px solid ${colors.gold};
  flex-direction: row;
  padding: 6px;
  border-radius: 6px;
  @media (max-width: 1320px) {
    height: 3rem;
  }
`;
