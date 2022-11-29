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
import { getFinalMoveCard, getMoveDistanceWithWind, getMoveWithSails, getWindBoost } from "../../../utils/directions";
import { MoveCard } from "../../../constants";
import styled from "styled-components";

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 8,
      rowEnd: 10,
      colStart: 4,
      colEnd: 10,
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
          components: { SelectedShip, SelectedMove, ShowMoves },
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
            world,
            move,
          };
        })
      );
    },
    // render
    ({ MoveCard, SelectedMove, SelectedShip, Rotation, SailPosition, ShowMoves, Position, Wind, world, move }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const showMoves = getComponentValue(ShowMoves, GodEntityIndex);
      if (!showMoves) return null;

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selectedMove = getComponentValue(SelectedMove, selectedShip as EntityIndex);

      if (!selectedShip) return null;

      const rotation = getComponentValueStrict(Rotation, selectedShip).value;
      const sailPosition = getComponentValueStrict(SailPosition, selectedShip).value;

      const moveEntities = [...getComponentEntities(MoveCard)];

      return (
        <Container style={{ width: "auto", marginTop: "6px" }}>
          <CloseButton
            onClick={() => {
              console.log("closing");
              removeComponent(ShowMoves, GodEntityIndex);
            }}
          >
            Close
          </CloseButton>
          <MoveButtons>
            {moveEntities
              .sort((a, b) => a - b)
              .map((entity) => {
                let moveCard = getComponentValueStrict(MoveCard, entity) as MoveCard;

                moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);

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
                    key={`move-selection-${entity}`}
                    onClick={() => {
                      console.log("movecard: ", moveCard);
                      setComponent(SelectedMove, selectedShip, { value: entity });
                    }}
                  >
                    <img
                      src={imageUrl}
                      style={{ height: "80%", objectFit: "scale-down", transform: `rotate(${rotation + 90}deg)` }}
                    />
                    <p>
                      {moveCard.distance}M / {Math.round((moveCard.direction + rotation) % 360)}º
                    </p>
                  </Button>
                );
              })}
            <Button
              onClick={() => {
                removeComponent(SelectedMove, selectedShip);
              }}
            >
              Clear
            </Button>
          </MoveButtons>
        </Container>
      );
    }
  );
}

const MoveButtons = styled(InternalContainer)`
  flex: 4;
  display: flex;
  justify-content: "flex-start";
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  height: 30px;
  width: 30px;
  position: absolute;
  top: 5;
  right: 5;
  border-radius: 50%;
  border: 0;
  background: hsla(0, 0%, 100%, 75%);
  font-size: 10px;
  pointer-events: all;
  z-index: 1000;
  cursor: pointer;
`;
