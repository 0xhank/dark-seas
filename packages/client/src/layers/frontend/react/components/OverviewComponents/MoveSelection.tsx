import { GodID } from "@latticexyz/network";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  setComponent,
} from "@latticexyz/recs";
import { Layers, MoveCard } from "../../../../../types";
import { getFinalMoveCard, getFinalPosition } from "../../../../../utils/directions";
import { inRange } from "../../../../../utils/distance";
import { Button } from "../../styles/global";
import { arrowImg } from "../../types";

export const MoveSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    world,
    utils: { getGameConfig },
    components: { Wind, MoveCard, Rotation, SailPosition, Position },
  } = layers.network;

  const {
    components: { SelectedMove },
  } = layers.backend;

  const worldRadius = getGameConfig()?.worldRadius;
  if (!worldRadius) return null;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const wind = getComponentValueStrict(Wind, GodEntityIndex);

  const selectedMove = getComponentValue(SelectedMove, ship as EntityIndex);

  const moveEntities = [...getComponentEntities(MoveCard)];

  const rotation = getComponentValueStrict(Rotation, ship).value;
  const sailPosition = getComponentValueStrict(SailPosition, ship).value;

  return (
    <>
      {moveEntities.map((entity) => {
        let moveCard = getComponentValueStrict(MoveCard, entity) as MoveCard;

        moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);
        const position = getComponentValueStrict(Position, ship);
        const isSelected = selectedMove && selectedMove.value == entity;

        const imageUrl = arrowImg(moveCard.rotation);

        const disabled = !inRange(
          getFinalPosition(moveCard, position, rotation, sailPosition, wind).finalPosition,
          { x: 0, y: 0 },
          worldRadius
        );
        return (
          <Button
            disabled={disabled}
            isSelected={isSelected}
            key={`move-selection-${entity}`}
            onClick={(e) => {
              e.preventDefault();
              setComponent(SelectedMove, ship, { value: entity });
            }}
          >
            <img
              src={imageUrl}
              style={{
                height: "80%",
                objectFit: "scale-down",
                // transform: `rotate(${rotation + 90}deg)`,
              }}
            />
            <p style={{ lineHeight: "16px" }}>{Math.round(moveCard.distance)}M</p>
          </Button>
        );
      })}
    </>
  );
};
