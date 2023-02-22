import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, setComponent } from "@latticexyz/recs";
import { useEffect } from "react";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { phaserConfig } from "../../../phaser/config";
import { Button, colors, Container } from "../../styles/global";
import PillBar from "../PillBar";

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

      <div style={{ display: "flex", width: "100%", height: "40%", gap: "12px" }}>
        <StatContainer>
          <Header>Ship Stats</Header>
          <div
            style={{
              display: "flex",
              height: "100%",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {prototype ? (
              <>
                <PillBar
                  stat={prototype.maxHealth}
                  maxStat={Math.max(prototype.maxHealth, 16)}
                  key={`${prototypeEntity}-health`}
                  title="health"
                />
                <PillBar
                  stat={prototype.length}
                  maxStat={Math.max(prototype.length, 16)}
                  key={`${prototypeEntity}-length`}
                  title="length"
                />
                <PillBar
                  stat={prototype.speed / 10}
                  maxStat={Math.max(prototype.speed / 10, 16)}
                  key={`${prototypeEntity}-speed`}
                  title="speed"
                />
              </>
            ) : (
              <p style={{ color: colors.darkGray }}>No ship selected</p>
            )}
          </div>
        </StatContainer>
        <StatContainer>
          <Header>Cannon Stats</Header>
          <div
            style={{
              display: "flex",
              height: "100%",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p style={{ color: colors.darkGray }}>No cannon selected</p>
          </div>
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

const Header = styled.p`
  font-size: 1.25rem;
  line-height: 1.5rem;
  text-align: left;
`;

const StatContainer = styled.div`
  width: 50%;
  background: ${colors.lightTan};
  border-radius: 6px;
  padding: 12px;
`;

const AddButton = styled(Button)`
  position: absolute;
  right: 12px;
  bottom: 12px;
  min-width: 100px;
`;
