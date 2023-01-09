import { GodID } from "@latticexyz/network";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import styled from "styled-components";
import { Layers } from "../../../../../types";
import { getFinalMoveCard, getFinalPosition } from "../../../../../utils/directions";
import { inRange } from "../../../../../utils/distance";
import { Img, OptionButton } from "../../styles/global";
import { arrowImg } from "../../types";

export const MoveSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    world,
    utils: { getGameConfig },
    components: { MoveCard, Rotation, SailPosition, Position },
  } = layers.network;

  const {
    components: { SelectedMove, SelectedShip, HoveredMove },
  } = layers.backend;

  const worldRadius = getGameConfig()?.worldRadius;
  if (!worldRadius) return null;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const selectedMove = getComponentValue(SelectedMove, ship as EntityIndex);

  const moveEntities = [...getComponentEntities(MoveCard)];

  const rotation = getComponentValueStrict(Rotation, ship).value;
  const sailPosition = getComponentValueStrict(SailPosition, ship).value;

  if (sailPosition == 0) {
    return <SpecialText>Cannot move with torn sails!</SpecialText>;
  }
  const sortedMoveEntities = moveEntities.sort(
    (a, b) =>
      ((180 + getComponentValueStrict(MoveCard, a).rotation) % 360) -
      (180 + (getComponentValueStrict(MoveCard, b).rotation % 360))
  );

  return (
    <>
      {sortedMoveEntities.map((entity) => {
        let moveCard = getComponentValueStrict(MoveCard, entity);
        moveCard = getFinalMoveCard(moveCard, rotation, sailPosition);
        const position = getComponentValueStrict(Position, ship);
        const isSelected = selectedMove && selectedMove.value == entity;

        const imageUrl = arrowImg(moveCard.rotation);

        const disabled = !inRange(
          getFinalPosition(moveCard, position, rotation, sailPosition).finalPosition,
          { x: 0, y: 0 },
          worldRadius
        );
        return (
          <OptionButton
            disabled={disabled}
            isSelected={isSelected}
            key={`move-selection-${entity}`}
            onMouseEnter={() => setComponent(HoveredMove, GodEntityIndex, { moveCardEntity: entity, shipEntity: ship })}
            onMouseLeave={() => removeComponent(HoveredMove, GodEntityIndex)}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelected) removeComponent(SelectedMove, ship);
              else {
                setComponent(SelectedShip, GodEntityIndex, { value: ship });
                setComponent(SelectedMove, ship, { value: entity });
              }
            }}
          >
            <Img src={imageUrl} style={{ transform: `rotate(${rotation + 90}deg)` }} />
            <Sub>{Math.round(moveCard.distance)}M</Sub>
          </OptionButton>
        );
      })}
    </>
  );
};

const SpecialText = styled.span`
  font-size: 2rem;
`;

const Sub = styled.p`
  line-height: 1rem;
  font-size: 0.8rem;
`;
