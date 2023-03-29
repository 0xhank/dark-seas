import styled from "styled-components";
import { Button } from "../../styles/global";
import { AvailableShips } from "./AvailableShips";
import { ShipDetails } from "./ShipDetails";
import { YourFleet } from "./YourFleet";

export function FleetPage({ back }: { back: () => void }) {
  return (
    <FleetContainer>
      <BackButton onClick={back}>back</BackButton>
      <Title>Build your fleet</Title>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <AvailableShips flex={1} />
        <ShipDetails flex={2} />
        <YourFleet flex={1} />
      </div>
    </FleetContainer>
  );
}

const Title = styled.p`
  font-size: 3.5rem;
  line-height: 4rem;
  font-weight: bolder;
`;

const FleetContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  text-align: center;
  padding: 12px;
  position: relative;
`;

const BackButton = styled(Button)`
  position: absolute;
  top: 12;
  left: 12;
  line-height: 1rem;
`;
