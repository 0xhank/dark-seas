import { EntityIndex, getComponentValue } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import styled from "styled-components";
import { useMUD } from "../../../../MUDContext";
import { colors, Container } from "../styles/global";

type ShipData = {
  location: Coord;
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

export function registerDamageChance() {
  const {
    components: { Loaded, HoveredAction },
    utils: { getTargetedShips, getDamageLikelihood, getSpriteObject },
    godEntity,
    scene: { camera },
  } = useMUD();

  const hoveredAction = getComponentValue(HoveredAction, godEntity);

  if (!hoveredAction) return null;
  const cannonEntity = hoveredAction.specialEntity as EntityIndex;

  if (!cannonEntity) return null;

  if (!getComponentValue(Loaded, cannonEntity)?.value) return null;
  const cam = camera.phaserCamera;

  const data = getTargetedShips(hoveredAction.specialEntity as EntityIndex).reduce((curr: ShipData[], ship) => {
    const shipObject = getSpriteObject(ship);

    const x = Math.round(((shipObject.x - cam.worldView.x) * cam.zoom) / 2);
    const y = Math.round(((shipObject.y - cam.worldView.y) * cam.zoom) / 2);

    const location = { x, y };
    const hitChances = getDamageLikelihood(cannonEntity, ship);
    if (!hitChances) return curr;
    return [...curr, { location, ...hitChances }];
  }, []);

  const prefix = "/img/explosions/explosion";
  const width = cam.zoom * 100;
  const fontSize = cam.zoom;
  const borderRadius = cam.zoom * 6;
  return (
    <Container style={gridConfig}>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {data.map((ship) => {
          return (
            <DamageContainer
              top={ship.location.y}
              left={ship.location.x}
              width={width}
              borderRadius={borderRadius}
              key={`ship-${ship.location.x}-${ship.location.y}`}
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
