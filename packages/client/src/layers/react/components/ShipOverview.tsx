import React from "react";
import { registerUIComponent } from "../engine";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { GodID } from "@latticexyz/network";
import { colors, Container } from "../styles/global";
import { SailPositions } from "../../../constants";
import Sails from "./OverviewComponents/Sails";
import AttackButton from "./OverviewComponents/AttackButton";
import styled from "styled-components";
import HullHealth from "./OverviewComponents/HullHealth";

export function registerShipOverview() {
  registerUIComponent(
    // name
    "ShipOverview",
    // grid location
    {
      rowStart: 1,
      rowEnd: 11,
      colStart: 10,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { changeSail, move, attack, repairMast, repairLeak, repairSail, extinguishFire },
          components: { Health, SailPosition, CrewCount, DamagedSail, Firepower, Leak, OnFire },
        },
        phaser: {
          components: { SelectedMove, SelectedShip },
        },
      } = layers;

      return merge(
        of(0),
        Health.update$,
        SelectedShip.update$,
        SelectedMove.update$,
        SailPosition.update$,
        CrewCount.update$,
        DamagedSail.update$,
        Firepower.update$,
        Leak.update$,
        OnFire.update$
      ).pipe(
        map(() => {
          return {
            world,
            SelectedShip,
            Health,
            SelectedMove,
            SailPosition,
            CrewCount,
            DamagedSail,
            Firepower,
            Leak,
            OnFire,
            changeSail,
            move,
            attack,
            repairMast,
            repairLeak,
            repairSail,
            extinguishFire,
          };
        })
      );
    },
    ({
      world,
      SelectedShip,
      Health,
      SelectedMove,
      SailPosition,
      CrewCount,
      DamagedSail,
      Firepower,
      Leak,
      OnFire,
      changeSail,
      move,
      attack,
      repairMast,
      repairLeak,
      repairSail,
      extinguishFire,
    }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      if (!shipEntity) {
        return <></>;
      }
      const moveEntity = getComponentValue(SelectedMove, GodEntityIndex)?.value as EntityIndex | undefined;

      const health = getComponentValueStrict(Health, shipEntity).value;
      const firepower = getComponentValueStrict(Firepower, shipEntity).value;
      const leak = getComponentValue(Leak, shipEntity);
      const onFire = getComponentValue(OnFire, shipEntity);
      const damagedSail = getComponentValue(DamagedSail, shipEntity);
      const crewCount = getComponentValueStrict(CrewCount, shipEntity).value;
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value as SailPositions;

      return (
        <Container style={{ paddingBottom: "0" }}>
          <BorderContainer>
            <ShipName style={{}}>{shipEntity.toString().slice(0, 7)}</ShipName>
            <OverviewContainer>
              {onFire && (
                <span style={{ color: "red" }}>
                  YOUR SHIP IS ON FIRE!
                  <button
                    onClick={() => {
                      extinguishFire(world.entities[shipEntity]);
                    }}
                  >
                    Extinguish
                  </button>
                </span>
              )}
              {leak && (
                <span style={{ color: "red" }}>
                  YOUR SHIP HAS SPRUNG A LEAK!
                  <button
                    onClick={() => {
                      repairLeak(world.entities[shipEntity]);
                    }}
                  >
                    Repair
                  </button>
                </span>
              )}
              {damagedSail && (
                <span style={{ color: "red" }}>
                  YOUR SHIP'S SAIL IS DAMAGED!
                  <button
                    onClick={() => {
                      repairSail(world.entities[shipEntity]);
                    }}
                  >
                    Repair
                  </button>
                </span>
              )}
              <HullHealth health={health} />
              <span>Ship firepower: {firepower}</span>
              <span>Ship crew: {crewCount}</span>

              <Sails
                changeSail={changeSail}
                repairMast={repairMast}
                shipEntity={world.entities[shipEntity]}
                sailPosition={sailPosition}
              />
              <AttackButton attack={attack} shipEntity={world.entities[shipEntity]} />
            </OverviewContainer>
          </BorderContainer>
        </Container>
      );
    }
  );
}

const borderThickness = 42;

const OverviewContainer = styled(Container)`
  border-radius: 20px;
  background: ${colors.blue};
  width: calc(100% - ${borderThickness}px);
  height: calc(100% - ${borderThickness}px);
`;

const BorderContainer = styled(Container)`
  background: ${colors.gold};
  border-radius: 20px;
`;

const ShipName = styled.div`
  position: absolute;
  top: 4;
  left: ${borderThickness};
  font-weight: 800;
  color: ${colors.darkBrown};
  line-height: 20px;
  font-size: 22px;
`;
