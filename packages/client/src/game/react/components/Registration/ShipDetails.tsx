import { useComponentValue } from "@latticexyz/react";
import {
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useGame } from "../../../../mud/providers/GameProvider";
import { Button, colors, Container } from "../../../../styles/global";
import { world } from "../../../../world";
import PillBar from "../PillBar";
import { createMinimap, createMinimapSystems } from "./createMinimap";

export function ShipDetails({ flex }: { flex: number }) {
  const {
    components: {
      ActiveShip,
      StagedShips,
      Length,
      Rotation,
      Firepower,
      Cannon,
      OwnedBy,
      Range,
      MaxHealth,
      ActiveCannon,
      Speed,
      Price,
    },
    gameEntity,
    utils: { getGameConfig },
  } = useGame();
  const mud = useGame();

  const [game, setGame] = useState<Phaser.Game>();
  const prototypeEntity = useComponentValue(ActiveShip, gameEntity)?.value as EntityIndex | undefined;
  const activeCannon = useComponentValue(ActiveCannon, gameEntity)?.value as EntityIndex | undefined;
  const stagedShips = useComponentValue(StagedShips, gameEntity, { value: [] }).value as EntityIndex[];
  useEffect(() => {
    if (!game)
      createMinimap().then(({ game, scene }) => {
        setGame(game);
        createMinimapSystems(scene.phaserScene, mud);
      });
    return () => {
      game?.destroy(true);
    };
  }, []);

  const budget = getGameConfig()?.budget || 0;

  const spent = stagedShips.reduce((prev, curr) => {
    const price = getComponentValueStrict(Price, curr).value;
    return prev + price;
  }, 0);

  const price = prototypeEntity ? getComponentValueStrict(Price, prototypeEntity).value : 0;
  const length = prototypeEntity ? getComponentValueStrict(Length, prototypeEntity).value : 0;
  const maxHealth = prototypeEntity ? getComponentValueStrict(MaxHealth, prototypeEntity).value : 0;
  const speed = prototypeEntity ? getComponentValueStrict(Speed, prototypeEntity).value : 0;

  const cannons =
    prototypeEntity && !activeCannon
      ? [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[prototypeEntity] })])].map(
          (cannonEntity) => ({
            rotation: getComponentValueStrict(Rotation, cannonEntity).value,
            firepower: getComponentValueStrict(Firepower, cannonEntity).value,
            range: getComponentValueStrict(Range, cannonEntity).value,
          })
        )
      : undefined;

  const cannonsLength = cannons?.length || 1;
  const base = { firepower: 0, range: 0 };
  const sums =
    cannons?.reduce(
      (prev, curr) => ({
        firepower: prev.firepower + curr.firepower,
        range: prev.range + curr.range,
      }),
      base
    ) || base;

  const firepower = activeCannon
    ? getComponentValueStrict(Firepower, activeCannon).value
    : sums.firepower / cannonsLength;
  const range = activeCannon ? getComponentValueStrict(Range, activeCannon).value : sums.range / cannonsLength;

  const cannotAddShip = !prototypeEntity || spent + price > budget;
  const addShip = () => {
    const stagedShips = getComponentValue(StagedShips, gameEntity)?.value || [];

    if (!prototypeEntity) return;
    stagedShips.push(prototypeEntity);
    setComponent(StagedShips, gameEntity, { value: stagedShips });
    removeComponent(ActiveShip, gameEntity);
    removeComponent(ActiveCannon, gameEntity);
  };

  return (
    <Container style={{ flex }}>
      <Title>Ship Details</Title>
      <div
        style={{
          width: "100%",
          height: "60%",
          gap: "6px",
          background: colors.blue,
          borderRadius: "6px",
          position: "relative",
        }}
        id="phaser-cutin"
      >
        {prototypeEntity && (
          <AddButton disabled={cannotAddShip} onClick={addShip}>
            {cannotAddShip ? "Ship Too Expensive" : "Add Ship"}
          </AddButton>
        )}
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
                <PillBar stat={maxHealth} maxStat={Math.max(maxHealth, 10)} title="health" />
                <PillBar stat={length} maxStat={Math.max(length, 16)} title="length" />
                <PillBar stat={speed} maxStat={Math.max(speed, 16)} title="speed" />
              </>
            ) : (
              <p style={{ color: colors.darkGray }}>No ship selected</p>
            )}
          </div>
        </StatContainer>
        <StatContainer>
          <Header>{activeCannon || !prototypeEntity ? "Cannon Stats" : `Cannons (${cannonsLength})`}</Header>
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
                <PillBar stat={firepower} maxStat={Math.max(firepower, 16)} title="firepower" />
                <PillBar stat={range / 12} maxStat={Math.max(range / 12, 16)} title="range" />
              </>
            ) : (
              <p style={{ color: colors.darkGray }}>No ship selected</p>
            )}
          </div>
        </StatContainer>
      </div>
    </Container>
  );
}

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
