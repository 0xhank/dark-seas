import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { of } from "rxjs";
import { Container } from "../styles/global";

export function registerShipSpawnButton() {
  registerUIComponent(
    // name
    "ShipSpawnButton",
    // grid location
    {
      rowStart: 1,
      rowEnd: 2,
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
        <Container
          style={{ cursor: "pointer" }}
          onClick={() => {
            spawnShip({ x: 0, y: 0 }, 0);
          }}
        >
          Spawn ship at (0, 0)
        </Container>
      );
    }
  );
}
