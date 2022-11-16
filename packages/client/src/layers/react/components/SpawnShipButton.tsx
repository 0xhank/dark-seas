import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { map, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";

export function registerSpawnShipButton() {
  registerUIComponent(
    // name
    "SpawnShipButton",
    // grid location
    {
      rowStart: 1,
      rowEnd: 2,
      colStart: 1,
      colEnd: 3,
    },
    // requirement
    (layers) => {
      return of(layers);
    },
    (layers) => {
      const {
        network: {
          api: { spawnShip },
        },
      } = layers;

      return (
        <div style={{ width: "100%", height: "100%", pointerEvents: "all" }}>
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
              spawnShip({ x: 0, y: 0 }, 0);
            }}
          >
            Spawn ship at (0, 0)
          </button>
        </div>
      );
    }
  );
}
