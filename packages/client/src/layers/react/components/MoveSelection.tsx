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

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 1,
      colEnd: 10,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { MoveAngle, MoveDistance, MoveRotation },
        },
        phaser: {
          components: { SelectedMove },
        },
      } = layers;

      return merge(MoveAngle.update$, SelectedMove.update$).pipe(
        map(() => {
          console.log("updating move selection");
          return {
            SelectedMove,
            MoveDistance,
            MoveRotation,
            MoveAngle,
            world,
          };
        })
      );
    },
    ({ MoveAngle, MoveDistance, MoveRotation, world, SelectedMove }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const moveEntities = [...getComponentEntities(MoveAngle)];
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "brown",
            textAlign: "center",
            padding: "5px",
            cursor: "pointer",
            pointerEvents: "all",
          }}
        >
          <span>Your move options</span>

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            {moveEntities.map((entity) => {
              const angle = getComponentValueStrict(MoveAngle, entity);
              const distance = getComponentValueStrict(MoveDistance, entity);
              const rotation = getComponentValueStrict(MoveRotation, entity);
              const selected = getComponentValue(SelectedMove, GodEntityIndex);

              const isSelected = selected && selected.value == entity;

              const imageUrl =
                rotation.value == 360 || rotation.value == 0
                  ? Arrows.Straight
                  : rotation.value > 270
                  ? Arrows.SoftLeft
                  : rotation.value == 270
                  ? Arrows.Left
                  : rotation.value > 180
                  ? Arrows.HardLeft
                  : rotation.value == 180
                  ? Arrows.UTurn
                  : rotation.value > 90
                  ? Arrows.HardRight
                  : rotation.value == 90
                  ? Arrows.Right
                  : Arrows.SoftRight;

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    // background: "hsla(120,100,100,.4)",
                    border: "1px solid white",
                    cursor: "pointer",
                    padding: "5px",
                    borderWidth: `${isSelected ? "3px" : "1px"}`,
                    pointerEvents: "all",
                    height: "70%",
                  }}
                  key={entity}
                  onClick={() => {
                    setComponent(SelectedMove, GodEntityIndex, { value: entity });
                    console.log(getComponentValue(SelectedMove, GodEntityIndex));
                  }}
                >
                  <img src={imageUrl} style={{ height: "80%", objectFit: "scale-down" }} />
                  <p>Distance: {distance.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  );
}
