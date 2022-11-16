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
      colEnd: 3,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { move },
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
        }))
      );
    },
    ({ SelectedMove, SelectedShip, move, world }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex);
      const moveEntity = getComponentValue(SelectedMove, GodEntityIndex);

      return (
        <div style={{ width: "100%", height: "100%", background: "red", pointerEvents: "all" }}>
          <button
            style={{
              width: "100%",
              height: "100%",
              background: "brown",
              textAlign: "center",
              padding: "5px",
              cursor: "pointer",
            }}
            disabled={!shipEntity || !moveEntity}
            onClick={() => {
              if (!shipEntity || !moveEntity) return;
              move(world.entities[shipEntity.value], world.entities[moveEntity.value]);
            }}
          >
            {!shipEntity ? (
              <span>Choose a ship</span>
            ) : !moveEntity ? (
              <span>Choose a move</span>
            ) : (
              <span>Move {shipEntity.value}</span>
            )}
          </button>
        </div>
      );
    }
  );
}
