import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { merge } from "rxjs";
import styled from "styled-components";
import { usePhaser } from "../../../mud/providers/PhaserProvider";
import { colors } from "../../../styles/global";
import { getMidpoint } from "../..//utils/trig";

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
    gameEntity,
    scene: { camera },
  } = usePhaser();
  useObservableValue(merge(camera.worldView$, camera.zoom$));

  const hoveredAction = useComponentValue(HoveredAction, gameEntity);
  const cannonEntity = hoveredAction?.specialEntity as EntityIndex;
  const loaded = useComponentValue(Loaded, cannonEntity)?.value;

  if (!hoveredAction || !cannonEntity || !loaded) return null;

  const cam = camera.phaserCamera;

  const data = getTargetedShips(hoveredAction.specialEntity as EntityIndex).reduce((curr: ShipData[], ship) => {
    const shipObject = getSpriteObject(ship);
    const front = { x: shipObject.x, y: shipObject.y };
    const angle = shipObject.angle + 90;
    const length = shipObject.displayHeight;
    const position = getMidpoint(front, angle, length);

    const x = Math.round(((position.x - cam.worldView.x) * cam.zoom) / 2);
    const y = Math.round(((position.y - cam.worldView.y) * cam.zoom) / 2) + (length / 10) * cam.zoom;

    const hitChances = getDamageLikelihood(cannonEntity, ship);
    if (!hitChances) return curr;
    return [...curr, { position: { x, y }, ...hitChances }];
  }, []);
  const prefix = "/img/explosions/explosion";
  const width = cam.zoom * 150;
  const fontSize = cam.zoom * 1.3;
  const borderRadius = cam.zoom * 9;
  if (data.length == 0) return null;
  return (
    <>
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
    </>
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
  transform: translate(-50%, 0);
`;

const StatContainer = styled.div<{ fontSize: number }>`
  display: flex;
  flex-direction: column;
  line-height: ${({ fontSize }) => fontSize * 2}rem;
  color: ${colors.darkBrown};
  font-size: ${({ fontSize }) => fontSize}rem;
  font-weight: 700;
`;
