import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import styled from "styled-components";
import { useMUD } from "../../mud/providers/MUDProvider";
import { colors, Container } from "../styles/global";

type ShipData = {
  position: Coord;
  1: number;
  2: number;
  3: number;
};

const gridConfig = {
  gridRowStart: 1,
  gridRowEnd: 13,
  gridColumnStart: 1,
  gridColumnEnd: 13,
};

export function DamageChance() {
  const {
    components: { Loaded, HoveredAction },
    utils: { getTargetedShips, getDamageLikelihood, getSpriteObject },
    godEntity,
    scene: { camera },
  } = useMUD();

  const hoveredAction = useComponentValue(HoveredAction, godEntity);
  const cannonEntity = hoveredAction?.specialEntity as EntityIndex;
  const loaded = useComponentValue(Loaded, cannonEntity)?.value;
  useObservableValue(HoveredAction.update$);

  if (!hoveredAction || !cannonEntity || !loaded) return null;

  const cam = camera.phaserCamera;

  const data = getTargetedShips(hoveredAction.specialEntity as EntityIndex).reduce((curr: ShipData[], ship) => {
    const shipObject = getSpriteObject(ship);

    const x = Math.round(((shipObject.x - cam.worldView.x) * cam.zoom) / 2);
    const y = Math.round(((shipObject.y - cam.worldView.y) * cam.zoom) / 2);

    const position = { x, y };
    const hitChances = getDamageLikelihood(cannonEntity, ship);
    if (!hitChances) return curr;
    return [...curr, { position, ...hitChances }];
  }, []);

  const prefix = "/img/explosions/explosion";
  const width = cam.zoom * 150;
  const fontSize = cam.zoom;
  const borderRadius = cam.zoom * 9;
  return (
    <Container style={gridConfig}>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {data.map((ship) => {
          return (
            <DamageContainer
              top={ship.position.y}
              left={ship.position.x}
              width={width}
              borderRadius={borderRadius}
              key={`ship-${ship.position.x}-${ship.position.y}`}
            >
              <StatContainer fontSize={fontSize}>
                <img src={prefix + "1.png"} /> {ship[1]}%
              </StatContainer>
              <StatContainer fontSize={fontSize}>
                <img src={prefix + "2.png"} /> {ship[2]}%
              </StatContainer>
              <StatContainer fontSize={fontSize}>
                <img src={prefix + "3.png"} /> {ship[3]}%
              </StatContainer>
            </DamageContainer>
          );
        })}
      </div>
    </Container>
  );
}

const DamageContainer = styled.div<{ top: number; left: number; width: number; borderRadius: number }>`
  position: absolute;
  width: ${({ width }) => width}px;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  display: grid;
  grid-template-columns: repeat(3, calc(33.3% - 3px));
  gap: 4px;
  background: ${colors.glass};
  border-radius: ${({ borderRadius }) => borderRadius}px;
  text-align: center;
`;

const StatContainer = styled.div<{ fontSize: number }>`
  display: flex;
  flex-direction: column;
  line-height: ${({ fontSize }) => fontSize * 2}rem;
  color: ${colors.darkBrown};
  font-size: ${({ fontSize }) => fontSize}rem;
`;
