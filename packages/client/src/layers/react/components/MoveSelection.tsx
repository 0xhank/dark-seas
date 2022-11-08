import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { getComponentEntities, getComponentValueStrict, getEntityComponents } from "@latticexyz/recs";
import { map, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";

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
      } = layers;

      return MoveAngle.update$.pipe(
        map(() => ({
          MoveDistance,
          MoveRotation,
          MoveAngle,
          world,
        }))
      );
    },
    ({ MoveAngle, MoveDistance, MoveRotation, world }) => {
      const moveEntities = [...getComponentEntities(MoveAngle)];
      console.log("moveEntities:", moveEntities);
      return (
        // <div style={{ width: "100%", height: "100%", background: "red" }}>
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

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "hsla(120,100,100,.4)",
                    border: "1px solid white",
                    cursor: "pointer",
                    padding: "5px",
                  }}
                  key={entity}
                  onClick={() => console.log("hello")}
                >
                  <p>Angle: {angle.value}</p>
                  <p>Distance: {distance.value}</p>
                  <p>Rotation: {rotation.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  );
}
