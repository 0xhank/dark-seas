import React from "react";
import { registerUIComponent } from "../engine";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Arrows } from "../../phaser/constants";
import { Container, Button, ConfirmButton, InternalContainer } from "../styles/global";
import { getMoveDistanceWithWind, getMoveWithSails, getWindBoost } from "../../../utils/directions";
import { MoveCard } from "../../../constants";
import styled from "styled-components";

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 11,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Rotation, MoveCard, Wind, SailPosition, Position },
          api: { move },
        },
        phaser: {
          components: { SelectedShip, SelectedMove },
        },
      } = layers;

      return merge(
        // of(0),
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$
      ).pipe(
        map(() => {
          return {
            Position,
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            Wind,
            world,
            move,
          };
        })
      );
    },
    // render
    ({ MoveCard, SelectedMove, SelectedShip, Rotation, SailPosition, Position, Wind, world, move }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selectedMove = getComponentValue(SelectedMove, GodEntityIndex);

      if (!selectedShip) return null;

      const rotation = getComponentValueStrict(Rotation, selectedShip).value;
      const sailPosition = getComponentValueStrict(SailPosition, selectedShip).value;

      const moveEntities = [...getComponentEntities(MoveCard)];

      return (
        <Container>
          <InternalContainer>
            <MoveButtons>
              {moveEntities
                .sort((a, b) => a - b)
                .map((entity) => {
                  let moveCard = getComponentValueStrict(MoveCard, entity) as MoveCard;

                  moveCard = { ...moveCard, distance: getMoveDistanceWithWind(wind, moveCard.distance, rotation) };

                  moveCard = getMoveWithSails(moveCard, sailPosition);

                  const isSelected = selectedMove && selectedMove.value == entity;

                  const imageUrl =
                    moveCard.rotation == 360 || moveCard.rotation == 0
                      ? Arrows.Straight
                      : moveCard.rotation > 270
                      ? Arrows.SoftLeft
                      : moveCard.rotation == 270
                      ? Arrows.Left
                      : moveCard.rotation > 180
                      ? Arrows.HardLeft
                      : moveCard.rotation == 180
                      ? Arrows.UTurn
                      : moveCard.rotation > 90
                      ? Arrows.HardRight
                      : moveCard.rotation == 90
                      ? Arrows.Right
                      : Arrows.SoftRight;

                  return (
                    <Button
                      isSelected={isSelected}
                      key={entity}
                      onClick={() => {
                        console.log("movecard: ", moveCard);
                        setComponent(SelectedMove, GodEntityIndex, { value: entity });
                      }}
                    >
                      <img
                        src={imageUrl}
                        style={{ height: "80%", objectFit: "scale-down", transform: `rotate(${rotation + 90}deg)` }}
                      />
                      <p>
                        {moveCard.distance}kts / {Math.round((moveCard.direction + rotation) % 360)}º
                      </p>
                    </Button>
                  );
                })}
            </MoveButtons>
            <ConfirmButtons>
              <Button
                onClick={() => removeComponent(SelectedMove, GodEntityIndex)}
                style={{ flex: 2, fontSize: "24px", lineHeight: "30px" }}
              >
                Clear Move
              </Button>
              <ConfirmButton
                disabled={!selectedMove?.value}
                style={{ flex: 3, fontSize: "24px", lineHeight: "30px" }}
                onClick={() => {
                  if (!selectedMove) return;
                  move(world.entities[selectedShip], world.entities[selectedMove.value]);
                }}
              >
                Submit Move
              </ConfirmButton>
            </ConfirmButtons>
          </InternalContainer>
        </Container>
      );
    }
  );
}

const MoveButtons = styled.div`
  flex: 4;
  display: flex;
  justify-content: "flex-start";
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
`;

const ConfirmButtons = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 5px;
`;
