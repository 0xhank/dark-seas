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

export function registerMoveSelection() {
  registerUIComponent(
    // name
    "MoveSelection",
    // grid location
    {
      rowStart: 11,
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

              console.log(`selected: ${selected}, current entity: ${entity}`);
              const isSelected = selected && selected.value == entity;

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
                  }}
                  key={entity}
                  onClick={() => {
                    setComponent(SelectedMove, GodEntityIndex, { value: entity });
                    console.log(getComponentValue(SelectedMove, GodEntityIndex));
                  }}
                >
                  <p>Angle: {angle.value}</p>
                  <p>Distance: {distance.value}</p>
                  <p>Rotation: {rotation.value}</p>
                  {/* <p>selected entity: {selected.value}</p> */}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  );
}
