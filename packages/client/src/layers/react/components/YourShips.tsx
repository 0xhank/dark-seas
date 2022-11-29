import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Arrows } from "../../phaser/constants";
import { Container, Button, ConfirmButton, InternalContainer, colors } from "../styles/global";
import { getFinalMoveCard } from "../../../utils/directions";
import { MoveCard } from "../../../constants";
import styled from "styled-components";
import { Coord } from "@latticexyz/utils";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Rotation, MoveCard, Wind, SailPosition, Position, Ship },
          api: { move },
        },
        phaser: {
          components: { SelectedShip, SelectedMove, ShowMoves },
          scenes: {
            Main: { camera },
          },
          positions,
        },
      } = layers;

      return merge(
        // of(0),
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$,
        ShowMoves.update$
      ).pipe(
        map(() => {
          return {
            Position,
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            ShowMoves,
            Wind,
            Ship,
            world,
            camera,
            positions,
            move,
          };
        })
      );
    },
    // render
    (props) => {
      const {
        MoveCard,
        SelectedMove,
        SelectedShip,
        Rotation,
        SailPosition,
        ShowMoves,
        camera,
        positions,
        Position,
        Wind,
        Ship,
        world,
        move,
      } = props;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selectedMove = getComponentValue(SelectedMove, GodEntityIndex);

      const yourShips = [...getEntitiesWithValue(Ship, { value: true })];

      const selectShip = (ship: EntityIndex, position: Coord) => {
        camera.phaserCamera.pan(position.x * positions.posWidth, position.y * positions.posHeight, 200, "Linear");
        camera.phaserCamera.zoomTo(1, 200, "Linear");
        setComponent(SelectedShip, GodEntityIndex, { value: ship });
      };

      return (
        <Container>
          <InternalContainer>
            <MoveButtons>
              {yourShips.map((ship) => {
                const sailPosition = getComponentValueStrict(SailPosition, ship).value;
                const rotation = getComponentValueStrict(Rotation, ship).value;
                const position = getComponentValueStrict(Position, ship);
                const moveCardEntity = getComponentValue(SelectedMove, ship);
                const isSelected = selectedShip == ship;

                const SelectButton = () => {
                  if (!moveCardEntity)
                    return (
                      <SelectShipButton
                        onClick={() => {
                          selectShip(ship, position);
                          setComponent(ShowMoves, GodEntityIndex, { value: true });
                        }}
                      >
                        Select Move
                      </SelectShipButton>
                    );

                  let moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex) as MoveCard;

                  moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);

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
                    <SelectShipButton
                      isSelected={isSelected}
                      onClick={() => {
                        console.log("movecard: ", moveCard);
                        selectShip(ship, position);
                      }}
                    >
                      <img
                        src={imageUrl}
                        style={{
                          height: "35px",
                          width: "35px",
                          objectFit: "scale-down",
                          transform: `rotate(${rotation + 90}deg)`,
                        }}
                      />
                      <p>
                        {moveCard.distance}M / {Math.round((moveCard.direction + rotation) % 360)}º
                      </p>
                    </SelectShipButton>
                  );
                };

                return (
                  <Button
                    onClick={() => selectShip(ship, position)}
                    style={{ position: "relative", display: "flex", justifyContent: "center", minWidth: "150px" }}
                    isSelected={isSelected}
                    key={`move-selection-${ship}`}
                  >
                    <span style={{ flex: 1, fontSize: "20px" }}>HMS {ship}</span>
                    <img
                      src="/img/ds-ship.png"
                      style={{ flex: 1, width: "50%", transform: `rotate(${rotation - 90}deg)` }}
                    />
                    <SelectButton />
                  </Button>
                );
              })}
            </MoveButtons>
            <ConfirmButtons>
              <Button
                onClick={() => removeComponent(SelectedMove, GodEntityIndex)}
                style={{ flex: 2, fontSize: "24px", lineHeight: "30px" }}
                disabled={!selectedMove?.value}
              >
                Clear Move
              </Button>
              <ConfirmButton
                disabled={!selectedMove?.value}
                style={{ flex: 3, fontSize: "24px", lineHeight: "30px" }}
                onClick={() => {
                  if (!selectedMove) return;
                  // move(world.entities[selectedShip], world.entities[selectedMove.value]);
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

const SelectShipButton = styled.div<{ isSelected?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  color: ${colors.darkBrown};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? colors.gold : "hsla(0, 0%, 100%, 0.75)"}`};
  }

  :disabled {
    background: ${colors.lightGray};
    color: ${colors.lighterGray};
    border-color: ${colors.darkGray};
    cursor: not-allowed;
    hover: {
      background: ${colors.lightGray};
    }
  }

  padding: 3;
  line-height: 30px;
  background: hsla(0, 0%, 100%, 0.5);
  width: 95%;
`;
