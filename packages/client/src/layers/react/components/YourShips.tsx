import React from "react";
import { registerUIComponent } from "../engine";
import {
  EntityID,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  getEntitiesWithValue,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Arrows, SelectionType, ShipAttributeTypes } from "../../phaser/constants";
import { Container, Button, ConfirmButton, InternalContainer, colors } from "../styles/global";
import { getFinalMoveCard } from "../../../utils/directions";
import { MoveCard, SailPositions } from "../../../constants";
import styled from "styled-components";
import { Coord } from "@latticexyz/utils";
import HullHealth from "./OverviewComponents/HullHealth";
import ShipAttribute from "./OverviewComponents/ShipAttribute";
import ShipDamage from "./OverviewComponents/ShipDamage";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: {
            Rotation,
            MoveCard,
            SailPosition,
            Position,
            Wind,
            Player,
            Health,
            CrewCount,
            DamagedSail,
            Firepower,
            Leak,
            OnFire,
            Ship,
          },
          api: { move, submitActions },
          network: { connectedAddress },
          utils: { getPlayerEntity },
        },
        phaser: {
          components: { SelectedShip, SelectedMove, Selection },
          scenes: {
            Main: { camera },
          },
          positions,
        },
      } = layers;

      return merge(
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$,
        Selection.update$,
        Player.update$,
        Health.update$,
        CrewCount.update$,
        DamagedSail.update$,
        Firepower.update$,
        Leak.update$,
        OnFire.update$,
        Ship.update$
      ).pipe(
        map(() => {
          return {
            Position,
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            Selection,
            Player,
            Wind,
            Ship,
            Health,
            CrewCount,
            Firepower,
            Leak,
            OnFire,
            DamagedSail,
            world,
            camera,
            positions,
            connectedAddress,
            move,
            getPlayerEntity,
          };
        })
      );
    },
    // render
    (props) => {
      const {
        MoveCard,
        SelectedMove,
        SelectedShip,
        Rotation,
        Selection,
        camera,
        positions,
        Position,
        Wind,
        Ship,
        Health,
        Player,
        CrewCount,
        Firepower,
        SailPosition,
        DamagedSail,
        OnFire,
        Leak,
        world,
        connectedAddress,
        getPlayerEntity,
        move,
      } = props;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;

      const yourShips = [...getEntitiesWithValue(Ship, { value: true })];

      const selectedMoves = [...getComponentEntities(SelectedMove)];

      const handleSubmit = () => {
        const shipsAndMoves: { ships: EntityID[]; moves: EntityID[] } = yourShips.reduce(
          (prev: { ships: EntityID[]; moves: EntityID[] }, curr: EntityIndex) => {
            const shipMove = getComponentValue(SelectedMove, curr);
            if (!shipMove) return prev;
            return {
              ships: [...prev.ships, world.entities[curr]],
              moves: [...prev.moves, world.entities[shipMove.value]],
            };
          },
          { ships: [], moves: [] }
        );

        if (shipsAndMoves.ships.length == 0) return;

        move(shipsAndMoves.ships, shipsAndMoves.moves);
      };

      const selectShip = (ship: EntityIndex, position: Coord) => {
        camera.phaserCamera.pan(position.x * positions.posWidth, position.y * positions.posHeight, 200, "Linear");
        camera.phaserCamera.zoomTo(1, 200, "Linear");
        setComponent(SelectedShip, GodEntityIndex, { value: ship });
        setComponent(Selection, GodEntityIndex, { value: SelectionType.Move });
      };

      return (
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer style={{ gap: "24px" }}>
            <MoveButtons>
              {yourShips.map((ship) => {
                const sailPosition = getComponentValueStrict(SailPosition, ship).value;
                const rotation = getComponentValueStrict(Rotation, ship).value;
                const position = getComponentValueStrict(Position, ship);
                const health = getComponentValueStrict(Health, ship).value;
                const crewCount = getComponentValueStrict(CrewCount, ship).value;
                const firepower = getComponentValueStrict(Firepower, ship).value;
                const onFire = getComponentValue(OnFire, ship)?.value;
                const leak = getComponentValue(Leak, ship)?.value;
                const damagedSail = getComponentValue(DamagedSail, ship)?.value;
                const moveCardEntity = getComponentValue(SelectedMove, ship);
                const isSelected = selectedShip == ship;

                const SelectButton = () => {
                  if (!moveCardEntity)
                    return (
                      <SelectShip
                        isSelected={isSelected}
                        onClick={() => {
                          selectShip(ship, position);
                          setComponent(Selection, GodEntityIndex, { value: SelectionType.Move });
                        }}
                      >
                        Select Move
                      </SelectShip>
                    );

                  let moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex) as MoveCard;

                  moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);

                  const imageUrl =
                    moveCard.rotation == 360 || moveCard.rotation == 0
                      ? Arrows.Straight
                      : moveCard.rotation > 270
                      ? Arrows.SoftLeft
                      : moveCard.rotation == 270
                      ? Arrows.Left
                      : moveCard.rotation > 180
                      ? Arrows.HardLeft
                      : moveCard.rotation == 180
                      ? Arrows.UTurn
                      : moveCard.rotation > 90
                      ? Arrows.HardRight
                      : moveCard.rotation == 90
                      ? Arrows.Right
                      : Arrows.SoftRight;

                  return (
                    <SelectShip
                      isSelected={isSelected}
                      onClick={() => {
                        console.log("movecard: ", moveCard);
                        selectShip(ship, position);
                      }}
                    >
                      <img
                        src={imageUrl}
                        style={{
                          height: "35px",
                          width: "35px",
                          objectFit: "scale-down",
                          transform: `rotate(${rotation + 90}deg)`,
                        }}
                      />
                      <p>
                        {moveCard.distance}M / {Math.round((moveCard.direction + rotation) % 360)}º
                      </p>
                    </SelectShip>
                  );
                };

                return (
                  <Button
                    noGoldBorder
                    onClick={() => selectShip(ship, position)}
                    style={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "space-between",
                      minWidth: "150px",
                      flex: "1",
                    }}
                    isSelected={isSelected}
                    key={`move-selection-${ship}`}
                  >
                    <div style={{ display: "flex", borderRadius: "6px", width: "100%", height: "100%" }}>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        <span style={{ fontSize: "20px", lineHeight: "28px" }}>HMS {ship}</span>
                        <span style={{ lineHeight: "16px", fontSize: "14px" }}>
                          ({position.x}, {position.y})
                        </span>
                        <img
                          src="/img/ds-ship.png"
                          style={{
                            objectFit: "scale-down",
                            position: "absolute",
                            bottom: 30,
                            margin: "auto",
                            left: "50%",
                            transform: `rotate(${rotation - 90}deg) translate(50%, 0)`,
                          }}
                        />
                      </div>
                      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
                        <HullHealth health={health} />
                        <div style={{ display: "flex", width: "100%" }}>
                          <ShipAttribute attributeType={ShipAttributeTypes.Crew} attribute={crewCount} />
                          <ShipAttribute attributeType={ShipAttributeTypes.Firepower} attribute={firepower} />
                          <ShipAttribute
                            attributeType={ShipAttributeTypes.Sails}
                            attribute={SailPositions[sailPosition]}
                          />
                        </div>
                        <div style={{ display: "flex" }}>
                          {damagedSail && <ShipDamage message="sails torn" />}
                          {onFire && <ShipDamage message="on fire" />}
                          {leak && <ShipDamage message="leaking" />}
                          {sailPosition == 0 && <ShipDamage message="mast broken" />}
                        </div>
                      </div>
                    </div>

                    <SelectButton />
                  </Button>
                );
              })}
            </MoveButtons>
            <ConfirmButtons>
              <Button
                disabled={selectedMoves.length == 0}
                noGoldBorder
                onClick={() => {
                  selectedMoves.map((entity) => removeComponent(SelectedMove, entity));
                }}
                style={{ flex: 2, fontSize: "24px", lineHeight: "30px" }}
              >
                Clear Moves
              </Button>
              <ConfirmButton
                disabled={selectedMoves.length == 0}
                style={{ flex: 3, fontSize: "24px", lineHeight: "30px" }}
                onClick={handleSubmit}
              >
                Submit Moves
              </ConfirmButton>
            </ConfirmButtons>
          </InternalContainer>
        </Container>
      );
    }
  );
}

const MoveButtons = styled.div`
  flex: 5;
  display: flex;
  justify-content: "flex-start";
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
`;

const ConfirmButtons = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  flex-direction: column-reverse;
  gap: 5px;
`;

const SelectShip = styled.div<{ isSelected?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  color: ${colors.darkBrown};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? colors.thickGlass : colors.gold}`};
  }

  padding: 3;
  line-height: 30px;
  background: ${colors.glass};
  width: 95%;
  border: 1px solid ${colors.gold};
  height: 60px;
`;
