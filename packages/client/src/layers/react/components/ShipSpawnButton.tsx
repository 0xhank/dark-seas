import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { of } from "rxjs";
import { Button, Container } from "../styles/global";

export function registerShipSpawnButton() {
  registerUIComponent(
    // name
    "ShipSpawnButton",
    // grid location
    {
      rowStart: 3,
      rowEnd: 4,
      colStart: 1,
      colEnd: 2,
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
        <Button
          style={{ width: "100%", height: "100%" }}
          onClick={() => {
            spawnShip({ x: 0, y: 0 }, 0);
          }}
        >
          Spawn ship at (0, 0)
        </Button>
      );
    }
  );
}
