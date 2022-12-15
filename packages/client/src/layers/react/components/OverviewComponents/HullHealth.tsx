import styled from "styled-components";
import { colors, Container } from "../../styles/global";

export default function HullHealth({ health }: { health: number }) {
  const maxHealth = 10;
  return (
    <HealthContainer>
      <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "1rem" }}>hull</span>
      <span style={{ display: "flex", gap: "6px", width: "100%", height: "100%" }}>
        {Array(maxHealth)
          .fill(0)
          .map((val, idx) => {
            return (
              <div
                style={{ height: "100%", flex: 1, background: idx <= health ? colors.lightBrown : "transparent" }}
                key={`hull-health-${idx}`}
              />
            );
          })}
      </span>
    </HealthContainer>
  );
}

const HealthContainer = styled(Container)`
  background: ${colors.thickGlass};
  height: 45px;
  width: 100%;
  color: ${colors.darkBrown};
  flex-direction: row;
  padding: 6px;
  border-radius: 6px;
`;
