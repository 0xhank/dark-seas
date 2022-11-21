import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import {
  EntityID,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  setComponent,
} from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { GodID } from "@latticexyz/network";
import { Arrows } from "../../phaser/constants";
import { Container, MoveOption } from "../styles/global";
import { getMoveDistanceWithWind, getWindBoost } from "../../../utils/directions";
import { SailPositionNames, SailPositions, Side } from "../../../constants";

export function registerShipOverview() {
  registerUIComponent(
    // name
    "ShipOverview",
    // grid location
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 8,
      colEnd: 10,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { changeSail, move, attack },
          components: { Health, SailPosition },
        },
        phaser: {
          components: { SelectedMove, SelectedShip },
        },
      } = layers;

      return merge(Health.update$, SelectedShip.update$, SelectedMove.update$, SailPosition.update$).pipe(
        map(() => {
          return {
            world,
            SelectedShip,
            Health,
            SelectedMove,
            SailPosition,
            changeSail,
            move,
            attack,
          };
        })
      );
    },
    ({ world, SelectedShip, Health, SelectedMove, SailPosition, changeSail, move, attack }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      if (!shipEntity) {
        return <Container />;
      }
      const moveEntity = getComponentValue(SelectedMove, GodEntityIndex)?.value as EntityIndex | undefined;

      const health = getComponentValueStrict(Health, shipEntity).value;
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value as SailPositions;
      return (
        <Container>
          <span>Ship health: {health}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>Sail position: {SailPositionNames[sailPosition]}</span>
            <span>
              <button
                disabled={sailPosition == SailPositions.Open}
                onClick={() => changeSail(world.entities[shipEntity], sailPosition + 1)}
              >
                Raise sails
              </button>
              <button
                disabled={sailPosition == SailPositions.Closed}
                onClick={() => changeSail(world.entities[shipEntity], sailPosition - 1)}
              >
                Lower sails
              </button>
            </span>
          </div>
          <MoveButton move={move} world={world} shipEntity={shipEntity} moveEntity={moveEntity} />
          <AttackButton attack={attack} world={world} shipEntity={shipEntity} />
        </Container>
      );
    }
  );
}

const MoveButton = ({
  move,
  world,
  shipEntity,
  moveEntity,
}: {
  move: (shipId: EntityID, moveId: EntityID) => void;
  world: any;
  shipEntity: EntityIndex | undefined;
  moveEntity: EntityIndex | undefined;
}) => (
  <button
    style={{
      width: "100%",
      background: "brown",
      textAlign: "center",
      padding: "5px",
      cursor: "pointer",
    }}
    disabled={!shipEntity || !moveEntity}
    onClick={() => {
      if (!shipEntity || !moveEntity) return;
      move(world.entities[shipEntity], world.entities[moveEntity]);
    }}
  >
    {!shipEntity ? (
      <span>Choose a ship</span>
    ) : !moveEntity ? (
      <span>Choose a move</span>
    ) : (
      <span>Move {shipEntity}</span>
    )}
  </button>
);

const AttackButton = ({
  attack,
  world,
  shipEntity,
}: {
  attack: (shipId: EntityID, side: Side) => void;
  world: any;
  shipEntity: EntityIndex;
}) => (
  <div style={{ width: "100%", background: "brown", pointerEvents: "all" }}>
    <span>Attack with {shipEntity}</span>
    <div style={{ display: "flex" }}>
      <button
        style={{
          textAlign: "center",
          padding: "5px",
          cursor: "pointer",
        }}
        disabled={!shipEntity}
        onClick={() => {
          if (!shipEntity) return;
          attack(world.entities[shipEntity], Side.Left);
        }}
      >
        LEFT
      </button>
      <button
        style={{
          textAlign: "center",
          padding: "5px",
          cursor: "pointer",
        }}
        disabled={!shipEntity}
        onClick={() => {
          if (!shipEntity) return;
          attack(world.entities[shipEntity], Side.Right);
        }}
      >
        RIGHT
      </button>
    </div>
  </div>
);
