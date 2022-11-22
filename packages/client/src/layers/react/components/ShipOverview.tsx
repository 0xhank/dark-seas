import React from "react";
import { registerUIComponent } from "../engine";
import { EntityID, EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Container } from "../styles/global";
import { SailPositionNames, SailPositions, Side } from "../../../constants";
import Sails from "./OverviewComponents/Sails";
import MoveButton from "./OverviewComponents/MoveButton";
import AttackButton from "./OverviewComponents/AttackButton";

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
          api: { changeSail, move, attack, repairMast },
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
            repairMast,
          };
        })
      );
    },
    ({ world, SelectedShip, Health, SelectedMove, SailPosition, changeSail, move, attack, repairMast }) => {
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
          <Sails
            changeSail={changeSail}
            repairMast={repairMast}
            shipEntity={world.entities[shipEntity]}
            sailPosition={sailPosition}
          />
          <MoveButton
            move={move}
            shipEntity={world.entities[shipEntity]}
            moveEntity={moveEntity ? world.entities[moveEntity] : undefined}
          />
          <AttackButton attack={attack} shipEntity={world.entities[shipEntity]} />
        </Container>
      );
    }
  );
}
