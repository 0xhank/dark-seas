import React from "react";
import { registerUIComponent } from "../engine";
import {
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  setComponent,
} from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Button, Container, InternalContainer } from "../styles/global";
import { SailPositionNames, SailPositions, Side } from "../../../constants";
import Sails from "./OverviewComponents/Sails";
import MoveButton from "./OverviewComponents/MoveButton";
import AttackButton from "./OverviewComponents/AttackButton";
import { Coord } from "@latticexyz/utils";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 3,
      rowEnd: 11,
      colStart: 1,
      colEnd: 3,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { spawnShip },
          components: { Health, Position, Rotation, Ship },
        },
        phaser: {
          components: { SelectedShip },
          scenes: {
            Main: { camera },
          },
          positions,
        },
      } = layers;

      return merge(of(0), Ship.update$, SelectedShip.update$).pipe(
        map(() => {
          return {
            world,
            SelectedShip,
            Health,
            Rotation,
            Position,
            Ship,
            camera,
            positions,
            spawnShip,
          };
        })
      );
    },
    ({ world, SelectedShip, Health, Position, Rotation, Ship, camera, positions, spawnShip }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;

      const yourShips = [...getEntitiesWithValue(Ship, { value: true })];

      const selectShip = (ship: EntityIndex, position: Coord) => {
        camera.phaserCamera.pan(position.x * positions.posWidth, position.y * positions.posHeight, 200, "Linear");
        camera.phaserCamera.zoomTo(2, 200, "Linear");
        setComponent(SelectedShip, GodEntityIndex, { value: ship });
      };

      return (
        <Container style={{ justifyContent: "flex-start" }}>
          <InternalContainer style={{ flexDirection: "column", height: "auto", gap: "8px" }}>
            <span style={{ textAlign: "center", width: "100%" }}>Your ships</span>
            {yourShips.map((ship) => {
              const position = getComponentValueStrict(Position, ship);
              const rotation = getComponentValueStrict(Rotation, ship).value;
              return (
                <Button
                  key={`your-ship-${ship}`}
                  isSelected={shipEntity == ship}
                  onClick={() => selectShip(ship, position)}
                >
                  <span>
                    Position: ({position.x}, {position.y})
                  </span>
                  <span>Rotation: {rotation}</span>
                </Button>
              );
            })}
            <Button
              style={{ width: "100%" }}
              onClick={() => {
                spawnShip({ x: 0, y: 0 }, 0);
              }}
            >
              Spawn ship at (0, 0)
            </Button>
          </InternalContainer>
        </Container>
      );
    }
  );
}
