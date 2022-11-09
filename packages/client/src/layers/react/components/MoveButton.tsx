import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { EntityIndex, getComponentEntities, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { GodID } from "@latticexyz/network";

export function registerMoveButton() {
  registerUIComponent(
    // name
    "MoveButton",
    // grid location
    {
      rowStart: 2,
      rowEnd: 3,
      colStart: 1,
      colEnd: 2,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { move },
          components: { MoveDistance, MoveAngle, MoveRotation },
        },
        phaser: {
          components: { SelectedMove, SelectedShip },
        },
      } = layers;
      return merge(of(0), SelectedMove.update$, SelectedShip.update$).pipe(
        map(() => ({
          SelectedMove,
          SelectedShip,
          move,
          world,
          MoveDistance,
          MoveAngle,
          MoveRotation,
        }))
      );
    },
    ({ SelectedMove, SelectedShip, move, world, MoveDistance, MoveAngle, MoveRotation }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex);
      const moveEntity = getComponentValue(SelectedMove, GodEntityIndex);

      if (!shipEntity || !moveEntity) {
        return <div>Select a ship and a move to continue</div>;
      }

      const moveEntityIndex = moveEntity.value as EntityIndex;
      const moveDistance = getComponentValueStrict(MoveDistance, moveEntityIndex);
      const moveAngle = getComponentValueStrict(MoveAngle, moveEntityIndex);
      const moveRotation = getComponentValueStrict(MoveRotation, moveEntityIndex);

      return (
        <div style={{ width: "100%", height: "100%", background: "red", pointerEvents: "all" }}>
          <span>Move ship {shipEntity.value}</span>
          {/* <span>
            Move distance: {moveDistance.value}, move angle: {moveAngle.value}, move rotation: {moveRotation.value}
          </span> */}
          <button
            style={{
              width: "100%",
              height: "100%",
              background: "brown",
              textAlign: "center",
              padding: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              console.log("hello");
              move(world.entities[shipEntity.value], world.entities[moveEntity.value]);
            }}
          >
            {" "}
            MOVE IT!
          </button>
        </div>
      );
    }
  );
}
