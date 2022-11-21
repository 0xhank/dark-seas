import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  getEntityComponents,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { GodID } from "@latticexyz/network";
import { Arrows } from "../../phaser/constants";
import { Container, MoveOption } from "../styles/global";
import { getMoveDistanceWithWind, getMoveWithSails, getWindBoost } from "../../../utils/directions";
import { MoveCard } from "../../../constants";

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 3,
      colEnd: 8,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Rotation, MoveCard, Wind, SailPosition, Position },
        },
        phaser: {
          components: { SelectedShip, SelectedMove },
        },
      } = layers;

      return merge(
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$
      ).pipe(
        map(() => {
          return {
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            Wind,
            world,
          };
        })
      );
    },
    // render
    ({ MoveCard, SelectedMove, SelectedShip, Rotation, SailPosition, Wind, world }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selectedMove = getComponentValue(SelectedMove, GodEntityIndex);

      if (!selectedShip) {
        return <Container />;
      }
      const rotation = getComponentValueStrict(Rotation, selectedShip).value;
      const windSpeedBoost = getWindBoost(wind.speed, wind.direction, rotation);
      const moveEntities = [...getComponentEntities(MoveCard)];
      return (
        <Container>
          <span>
            The wind is{" "}
            {windSpeedBoost < 0
              ? `slowing this ship by ${Math.abs(windSpeedBoost)} knots!`
              : windSpeedBoost > 0
              ? `giving this ship a ${Math.abs(windSpeedBoost)} knot boost!`
              : "doing nothing to this ship."}
          </span>

          <div
            style={{
              width: "100%",
              height: "70%",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {moveEntities
              .sort((a, b) => a - b)
              .map((entity) => {
                const sailPosition = getComponentValueStrict(SailPosition, selectedShip).value;
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
                  <MoveOption
                    isSelected={isSelected}
                    key={entity}
                    onClick={() => {
                      console.log("movecard: ", moveCard);
                      setComponent(SelectedMove, GodEntityIndex, { value: entity });
                    }}
                  >
                    <img src={imageUrl} style={{ height: "80%", objectFit: "scale-down" }} />
                    <p>
                      {moveCard.distance}kts / {Math.round((moveCard.direction + rotation) % 360)}º
                    </p>
                  </MoveOption>
                );
              })}
          </div>
        </Container>
      );
    }
  );
}
