import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Button, colors, Container } from "../../styles/global";
import PillBar from "../PillBar";
import { createMinimap, renderMinimapShip } from "./createMinimap";

export function ShipDetails({ flex }: { flex: number }) {
  const {
    components: { ActiveShip, StagedShips, Length, Rotation, Firepower, Range, MaxHealth, ActiveCannon, Speed },
    godEntity,
    utils: { decodeShipPrototype },
  } = useMUD();
  const mud = useMUD();

  const [game, setGame] = useState<Phaser.Game>();
  const [scene, setScene] = useState<Phaser.Scene>();
  const prototypeEntity = useComponentValue(ActiveShip, godEntity)?.value as EntityIndex | undefined;
  const activeCannon = useComponentValue(ActiveCannon, godEntity)?.value as EntityIndex | undefined;

  useEffect(() => {
    if (!game)
      createMinimap().then(({ game, scene }) => {
        setGame(game);
        setScene(scene.phaserScene);
      });
    return () => {
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    scene?.registry.get("ship")?.destroy(true, true);

    if (!mud || !scene || !prototypeEntity) return;

    renderMinimapShip(prototypeEntity, scene, mud);
  }, [mud, scene, prototypeEntity]);

  const stagedShips = useComponentValue(StagedShips, godEntity, { value: [] }).value;

  const length = prototypeEntity ? getComponentValueStrict(Length, prototypeEntity).value : 0;
  const maxHealth = prototypeEntity ? Number(getComponentValueStrict(MaxHealth, prototypeEntity).value) : 0;
  const speed = prototypeEntity ? getComponentValueStrict(Speed, prototypeEntity).value : 0;

  const rotation = activeCannon ? getComponentValueStrict(Rotation, activeCannon).value : 0;
  const firepower = activeCannon ? getComponentValueStrict(Firepower, activeCannon).value : 0;
  const range = activeCannon ? getComponentValueStrict(Range, activeCannon).value : 0;

  const addShip = () => {
    if (!prototypeEntity) return;
    stagedShips.push(prototypeEntity);
    setComponent(StagedShips, godEntity, { value: stagedShips });
  };

  return (
    <Container style={{ flex }}>
      <Title>Ship Details</Title>
      <div
        style={{ width: "100%", height: "60%", background: colors.blue, borderRadius: "6px", position: "relative" }}
        id="phaser-cutin"
      >
        <AddButton disabled={!prototypeEntity} onClick={addShip}>
          Add Ship
        </AddButton>
      </div>

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
            {prototypeEntity ? (
              <>
                <PillBar
                  stat={maxHealth}
                  maxStat={Math.max(maxHealth, 16)}
                  key={`${prototypeEntity}-health`}
                  title="health"
                />
                <PillBar
                  stat={length}
                  maxStat={Math.max(length, 16)}
                  key={`${prototypeEntity}-length`}
                  title="length"
                />
                <PillBar
                  stat={speed / 10}
                  maxStat={Math.max(speed / 10, 16)}
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
            {activeCannon ? (
              <>
                <PillBar
                  stat={firepower / 5}
                  maxStat={Math.max(firepower / 5, 16)}
                  key={`${activeCannon}-firepower`}
                  title="firepower"
                />
                <PillBar
                  stat={range / 12}
                  maxStat={Math.max(range / 12, 16)}
                  key={`${activeCannon}-range`}
                  title="range"
                />
              </>
            ) : (
              <p style={{ color: colors.darkGray }}>No cannon selected</p>
            )}
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
