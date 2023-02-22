import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Button, colors, Container } from "../../styles/global";
import HealthBar from "../ShipStatus/HealthBar";

export function ShipDetails({ flex }: { flex: number }) {
  const {
    components: { ActiveShip, StagedShips },
    godEntity,
    utils: { decodeShipPrototype },
  } = useMUD();

  const prototypeEntity = useComponentValue(ActiveShip, godEntity)?.value as EntityIndex | undefined;

  const stagedShips = useComponentValue(StagedShips, godEntity, { value: [] }).value;
  const prototype = prototypeEntity ? decodeShipPrototype(prototypeEntity) : undefined;

  const addShip = () => {
    if (!prototypeEntity) return;
    stagedShips.push(prototypeEntity);
    setComponent(StagedShips, godEntity, { value: stagedShips });
  };

  return (
    <Container style={{ flex }}>
      <Title>Ship Details</Title>
      <ClippedArea>
        <AddButton disabled={!prototypeEntity} onClick={addShip}>
          Add Ship
        </AddButton>
      </ClippedArea>

      <div style={{ display: "flex", width: "100%", height: "40%" }}>
        <StatContainer>
          Ship Stats
          {prototype && (
            <>
              <HealthBar
                health={prototype.maxHealth}
                maxHealth={Math.max(prototype.maxHealth, 16)}
                shipEntity={`${prototypeEntity}-health`}
                title="HEALTH"
              />
              <HealthBar
                health={prototype.length}
                maxHealth={Math.max(prototype.length, 16)}
                shipEntity={`${prototypeEntity}-length`}
                title="LENGTH"
              />
              <HealthBar
                health={prototype.speed / 10}
                maxHealth={Math.max(prototype.speed / 10, 16)}
                shipEntity={`${prototypeEntity}-speed`}
                title="SPEED"
              />
            </>
          )}
        </StatContainer>
        <StatContainer>
          <p>Cannon Stats</p>
          <p>Hover over a cannon to see its stats</p>
        </StatContainer>
      </div>
    </Container>
  );
}

const ClippedArea = styled.div`
  width: 100%;
  height: 60%;
  background: ${colors.blue};
  border-radius: 6px;
  position: relative;
`;
const Title = styled.p`
  font-size: 2.5rem;
  line-height: 3rem;
`;

const StatContainer = styled.div`
  width: 50%;
  background: ${colors.lightTan};
  border-radius: 6px;
`;

const AddButton = styled(Button)`
  position: absolute;
  right: 12px;
  bottom: 12px;
  min-width: 100px;
`;
