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
import { Arrows, SelectionType } from "../../phaser/constants";
import { Container, Button, ConfirmButton, InternalContainer } from "../styles/global";
import { getFinalMoveCard, getFinalPosition } from "../../../utils/directions";
import { Action, ActionImg, ActionNames, MoveCard, Phase } from "../../../constants";
import styled from "styled-components";
import { inRange } from "../../../utils/distance";

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 7,
      rowEnd: 9,
      colStart: 1,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Rotation, MoveCard, Wind, SailPosition, Position, Player },
          network: { clock },
          utils: { getPlayerEntity, getCurrentGamePhase, getGameConfig },
        },
        phaser: {
          components: { SelectedShip, SelectedMove, Selection, SelectedActions },
        },
      } = layers;

      return merge(
        // of(0),
        clock.time$,
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$,
        Selection.update$,
        SelectedActions.update$,
        Player.update$
      ).pipe(
        map(() => {
          return {
            Position,
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            Selection,
            SelectedActions,
            Player,
            Wind,
            world,
            getPlayerEntity,
            getCurrentGamePhase,
            getGameConfig,
          };
        })
      );
    },
    // render
    ({
      MoveCard,
      SelectedMove,
      SelectedShip,
      Rotation,
      SailPosition,
      Selection,
      SelectedActions,
      Position,
      Wind,
      Player,
      world,
      getPlayerEntity,
      getCurrentGamePhase,
      getGameConfig,
    }) => {
      const currentGamePhase: Phase | undefined = getCurrentGamePhase();
      const gameConfig = getGameConfig();

      if (currentGamePhase == undefined || !gameConfig) return null;

      const playerEntity = getPlayerEntity();
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const selection = getComponentValue(Selection, GodEntityIndex)?.value;
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;

      if (selection == undefined || selection == SelectionType.None || !selectedShip) return null;

      const selectedActions = getComponentValue(SelectedActions, selectedShip)?.value || [-1, -1, -1];

      const wind = getComponentValueStrict(Wind, GodEntityIndex);

      let content: JSX.Element = <></>;

      if (currentGamePhase == Phase.Commit) {
        const selectedMove = getComponentValue(SelectedMove, selectedShip as EntityIndex);

        const moveEntities = [...getComponentEntities(MoveCard)];

        const rotation = getComponentValueStrict(Rotation, selectedShip).value;
        const sailPosition = getComponentValueStrict(SailPosition, selectedShip).value;

        content = (
          <>
            {moveEntities
              .sort((a, b) => a - b)
              .map((entity) => {
                let moveCard = getComponentValueStrict(MoveCard, entity) as MoveCard;

                moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);
                const position = getComponentValueStrict(Position, selectedShip);
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
                    disabled={
                      !inRange(
                        getFinalPosition(moveCard, position, rotation, sailPosition, wind).finalPosition,
                        { x: 0, y: 0 },
                        gameConfig.worldRadius
                      )
                    }
                    isSelected={isSelected}
                    key={`move-selection-${entity}`}
                    onClick={() => {
                      setComponent(SelectedMove, selectedShip, { value: entity });
                    }}
                  >
                    <img
                      src={imageUrl}
                      style={{
                        height: "80%",
                        objectFit: "scale-down",
                        transform: `rotate(${rotation + 90}deg)`,
                      }}
                    />
                    <p style={{ lineHeight: "16px" }}>
                      {moveCard.distance}M / {Math.round((moveCard.direction + rotation) % 360)}º
                    </p>
                  </Button>
                );
              })}
          </>
        );
      } else {
        const selectedAction = selectedActions[selection - 1];
        content = (
          <>
            {Object.keys(Action).map((a) => {
              const action = Number(a);
              if (isNaN(action)) return null;
              const selected = selectedAction == action;
              const usedAlready = selectedActions.find((a) => a == action) != undefined;

              return (
                <Button
                  disabled={usedAlready && !selected}
                  isSelected={selected}
                  key={`selectedAction-${action}`}
                  onClick={() => {
                    // console.log("action: ", action);
                    const newArray = selectedActions;
                    selectedActions[selection - 1] = action;
                    setComponent(SelectedActions, selectedShip, { value: newArray });
                  }}
                >
                  <img
                    src={ActionImg[action]}
                    style={{
                      height: "80%",
                      objectFit: "scale-down",
                      filter: "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)",
                    }}
                  />
                  <p style={{ lineHeight: "16px" }}>{ActionNames[action]}</p>
                </Button>
              );
            })}
          </>
        );
      }

      return (
        <Container>
          <InternalContainer>
            <MoveButtons>{content}</MoveButtons>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Button
                onClick={() => {
                  removeComponent(Selection, GodEntityIndex);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (selection == SelectionType.Move) return removeComponent(SelectedMove, selectedShip);
                  let newArray = selectedActions;
                  newArray[selection - 1] = -1;
                  setComponent(SelectedActions, selectedShip, { value: newArray });
                }}
              >
                Clear Selection
              </Button>
            </div>
          </InternalContainer>
        </Container>
      );
    }
  );
}

const MoveButtons = styled.div`
  display: flex;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  width: auto;
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
  font-size: 0.75rem;
  pointer-events: all;
  z-index: 1000;
  cursor: pointer;
`;
