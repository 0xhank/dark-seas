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
import { getMoveDistanceWithWind, getWindBoost } from "../../../utils/directions";

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 3,
      colEnd: 10,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Rotation, MoveAngle, MoveDistance, MoveRotation, Wind },
        },
        phaser: {
          components: { SelectedShip, SelectedMove },
        },
      } = layers;

      return merge(MoveAngle.update$, SelectedMove.update$, SelectedShip.update$).pipe(
        map(() => {
          return {
            SelectedMove,
            MoveDistance,
            MoveRotation,
            MoveAngle,
            Rotation,
            SelectedShip,
            Wind,
            world,
          };
        })
      );
    },
    ({ MoveAngle, MoveDistance, MoveRotation, SelectedMove, SelectedShip, Rotation, Wind, world }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selectedMove = getComponentValue(SelectedMove, GodEntityIndex);

      if (!selectedShip) {
        return (
          <Container>
            <span>Select a ship</span>
          </Container>
        );
      }
      const rotation = getComponentValueStrict(Rotation, selectedShip).value;
      const windSpeedBoost = getWindBoost(wind.speed, wind.direction, rotation);
      const moveEntities = [...getComponentEntities(MoveAngle)];
      return (
        <Container>
          <span>
            The wind is{" "}
            {windSpeedBoost < 0
              ? `slowing this ship by ${Math.abs(windSpeedBoost)} knots!`
              : windSpeedBoost > 0
              ? `giving this ship a ${Math.abs(windSpeedBoost)} knot boost!`
              : "doing nothing for this ship."}
          </span>

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {moveEntities.map((entity) => {
              const moveDistance = getComponentValueStrict(MoveDistance, entity).value;
              const moveRotation = getComponentValueStrict(MoveRotation, entity).value;

              const isSelected = selectedMove && selectedMove.value == entity;

              const imageUrl =
                moveRotation == 360 || moveRotation == 0
                  ? Arrows.Straight
                  : moveRotation > 270
                  ? Arrows.SoftLeft
                  : moveRotation == 270
                  ? Arrows.Left
                  : moveRotation > 180
                  ? Arrows.HardLeft
                  : moveRotation == 180
                  ? Arrows.UTurn
                  : moveRotation > 90
                  ? Arrows.HardRight
                  : moveRotation == 90
                  ? Arrows.Right
                  : Arrows.SoftRight;

              return (
                <MoveOption
                  isSelected={isSelected}
                  key={entity}
                  onClick={() => setComponent(SelectedMove, GodEntityIndex, { value: entity })}
                >
                  <img src={imageUrl} style={{ height: "80%", objectFit: "scale-down" }} />
                  <p>Distance: {getMoveDistanceWithWind(wind.speed, wind.direction, moveDistance, rotation)}</p>
                </MoveOption>
              );
            })}
          </div>
        </Container>
      );
    }
  );
}
