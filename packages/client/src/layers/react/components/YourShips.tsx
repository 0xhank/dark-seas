import React from "react";
import { registerUIComponent } from "../engine";
import {
  EntityID,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Arrows, SelectionType, ShipAttributeTypes } from "../../phaser/constants";
import { Container, Button, ConfirmButton, InternalContainer, colors, BoxImage } from "../styles/global";
import { getFinalMoveCard } from "../../../utils/directions";
import { Action, ActionImg, ActionNames, MoveCard, Phase, SailPositions } from "../../../constants";
import styled from "styled-components";
import { Coord } from "@latticexyz/utils";
import HullHealth from "./OverviewComponents/HullHealth";
import ShipAttribute from "./OverviewComponents/ShipAttribute";
import ShipDamage from "./OverviewComponents/ShipDamage";
import { getShipSprite, ShipImages } from "../../../utils/ships";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 9,
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
            DamagedMast,
            Firepower,
            Leak,
            OnFire,
            Ship,
            OwnedBy,
            LastMove,
            LastAction,
          },
          api: { revealMove, submitActions, commitMove },
          network: { connectedAddress, clock },
          utils: { getPlayerEntity, getCurrentGamePhase, getCurrentGameTurn },
        },
        phaser: {
          components: { SelectedShip, SelectedMove, Selection, SelectedActions },
          scenes: {
            Main: { camera },
          },
          positions,
        },
      } = layers;

      return merge(
        clock.time$,
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
        DamagedMast.update$,
        Firepower.update$,
        Leak.update$,
        OnFire.update$,
        Ship.update$,
        SelectedActions.update$,
        OwnedBy.update$,
        LastMove.update$,
        LastAction.update$
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
            DamagedMast,
            SelectedActions,
            OwnedBy,
            LastMove,
            LastAction,
            world,
            camera,
            positions,
            connectedAddress,
            revealMove,
            getPlayerEntity,
            getCurrentGamePhase,
            submitActions,
            getCurrentGameTurn,
            commitMove,
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
        DamagedMast,
        OwnedBy,
        OnFire,
        Leak,
        SelectedActions,
        LastMove,
        LastAction,
        world,
        connectedAddress,
        getPlayerEntity,
        getCurrentGamePhase,
        revealMove,
        submitActions,
        getCurrentGameTurn,
        commitMove,
      } = props;

      const currentGamePhase: Phase | undefined = getCurrentGamePhase();
      const currentTurn = getCurrentGameTurn();

      if (currentGamePhase == undefined || currentTurn == undefined) return null;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const lastMove = getComponentValue(LastMove, playerEntity)?.value;
      const lastAction = getComponentValue(LastAction, playerEntity)?.value;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      const selection = getComponentValue(Selection, GodEntityIndex)?.value || -1;

      const yourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

      const selectedMoves = [...getComponentEntities(SelectedMove)];
      const selectedActions = [...getComponentEntities(SelectedActions)].map(
        (entity) => getComponentValue(SelectedActions, entity)?.value
      );

      const disabled =
        currentGamePhase == Phase.Commit
          ? selectedMoves.length == 0
          : selectedActions.length == 0 || selectedActions?.every((arr) => arr?.every((elem) => elem == -1));

      const handleSubmit = () => {
        if (currentGamePhase == Phase.Action) {
          const shipsAndActions = yourShips.reduce(
            (prev: { ships: EntityID[]; actions: Action[][] }, curr: EntityIndex) => {
              const actions = getComponentValue(SelectedActions, curr)?.value;
              if (!actions) return prev;
              const filteredActions = actions.filter((action) => action !== -1);
              return {
                ships: [...prev.ships, world.entities[curr]],
                actions: [...prev.actions, filteredActions],
              };
            },
            { ships: [], actions: [] }
          );
          if (shipsAndActions.ships.length == 0) return;
          submitActions(shipsAndActions.ships, shipsAndActions.actions);
        } else {
          const shipsAndMoves = yourShips.reduce(
            (prev: { ships: EntityID[]; moves: EntityID[] }, curr: EntityIndex) => {
              const shipMove = getComponentValue(SelectedMove, curr)?.value;
              if (!shipMove) return prev;
              return {
                ships: [...prev.ships, world.entities[curr]],
                moves: [...prev.moves, world.entities[shipMove]],
              };
            },
            { ships: [], moves: [] }
          );

          if (shipsAndMoves.ships.length == 0) return;
          currentGamePhase == Phase.Commit
            ? commitMove(shipsAndMoves.ships, shipsAndMoves.moves)
            : revealMove(shipsAndMoves.ships, shipsAndMoves.moves);
        }
      };

      const selectShip = (ship: EntityIndex, position: Coord) => {
        camera.setZoom(1);
        camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);

        setComponent(SelectedShip, GodEntityIndex, { value: ship });
      };

      return (
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer style={{ gap: "24px", height: "auto" }}>
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
                const damagedMast = getComponentValue(DamagedMast, ship)?.value;
                const moveCardEntity = getComponentValue(SelectedMove, ship);
                const isSelected = selectedShip == ship;
                const shipActions = getComponentValue(SelectedActions, ship)?.value;

                const SelectMoveButton = () => {
                  if (!moveCardEntity)
                    return (
                      <SelectShip
                        isSelected={isSelected}
                        onClick={() => {
                          if (health == 0) return;
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

                const ActionButton = ({
                  selectionType,
                  actionIndex,
                }: {
                  selectionType: SelectionType;
                  actionIndex: number;
                }) => {
                  const action = shipActions && shipActions[actionIndex] ? shipActions[actionIndex] : undefined;

                  return (
                    <SelectShip
                      isSelected={SelectionType[selectionType] == SelectionType[selection] && isSelected}
                      onClick={() => {
                        if (health == 0) return;
                        setComponent(Selection, GodEntityIndex, { value: selectionType });
                        setComponent(SelectedShip, GodEntityIndex, { value: ship });
                      }}
                      key={`action-button-${ship}-${selectionType}`}
                      style={{ flex: 1, width: "100%" }}
                    >
                      {action && action !== -1 ? (
                        <>
                          <img
                            src={ActionImg[action]}
                            style={{
                              height: "35px",
                              width: "35px",
                              objectFit: "scale-down",
                              filter:
                                "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)",
                            }}
                          />
                          <p style={{ lineHeight: "1rem" }}>{ActionNames[action]}</p>
                        </>
                      ) : (
                        <p style={{ fontSize: "1rem", lineHeight: "1rem" }}>Choose Action</p>
                      )}
                    </SelectShip>
                  );
                };

                return (
                  <YourShipContainer
                    onClick={() => health !== 0 && selectShip(ship, position)}
                    isSelected={isSelected}
                    key={`move-selection-${ship}`}
                  >
                    <div style={{ display: "flex", borderRadius: "6px", width: "100%" }}>
                      <div
                        style={{
                          flex: 2,
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          position: "relative",
                          maxWidth: "120px",
                          minWidth: "80px",
                        }}
                      >
                        <span style={{ fontSize: "1.5rem", lineHeight: "1.5rem" }}>HMS {ship}</span>
                        <span style={{ lineHeight: "2rem", fontSize: "1rem" }}>
                          ({position.x}, {position.y})
                        </span>
                        <BoxImage>
                          <img
                            src={ShipImages[getShipSprite(GodEntityIndex, GodEntityIndex, health)]}
                            style={{
                              objectFit: "scale-down",
                              left: "50%",
                              position: "absolute",
                              top: "50%",
                              margin: "auto",
                              transform: `rotate(${rotation - 90}deg) translate(-50%,-50%)`,
                              transformOrigin: `top left`,
                              maxWidth: "50px",
                            }}
                          />
                        </BoxImage>
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
                          {damagedMast && <ShipDamage message="mast broken" amountLeft={damagedMast} />}
                          {onFire && <ShipDamage message="on fire" amountLeft={onFire} />}
                          {leak && <ShipDamage message="leaking" />}
                          {sailPosition == 0 && <ShipDamage message="sails torn" />}
                        </div>
                      </div>
                    </div>
                    {currentGamePhase == Phase.Commit ? (
                      <SelectMoveButton />
                    ) : currentGamePhase == Phase.Action ? (
                      <ActionButtons>
                        <ActionButton selectionType={SelectionType.Action1} actionIndex={0} />
                        <ActionButton selectionType={SelectionType.Action2} actionIndex={1} />
                        <ActionButton selectionType={SelectionType.Action3} actionIndex={2} />
                      </ActionButtons>
                    ) : null}
                  </YourShipContainer>
                );
              })}
            </MoveButtons>
            <ConfirmButtons>
              <Button
                disabled={disabled}
                noGoldBorder
                onClick={() => {
                  yourShips.map((entity) => {
                    removeComponent(SelectedMove, entity);
                    removeComponent(SelectedActions, entity);
                  });
                }}
                style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
              >
                Clear
              </Button>
              <ConfirmButton
                // disabled={
                //   disabled || (currentGamePhase == Phase.Commit ? currentTurn == lastMove : currentTurn == lastAction)
                // }
                style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                onClick={handleSubmit}
              >
                {currentGamePhase == Phase.Commit
                  ? "Commit Moves"
                  : currentGamePhase == Phase.Action
                  ? "Submit Actions"
                  : "Reveal Moves"}
              </ConfirmButton>
            </ConfirmButtons>
          </InternalContainer>
        </Container>
      );
    }
  );
}

const YourShipContainer = styled(InternalContainer)`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 150px;
  flex: 1;
  height: auto;
  cursor: pointer;

  :hover {
    background: ${({ isSelected }) => `${isSelected ? colors.lightGold : colors.thickGlass}`};
  }
`;
const MoveButtons = styled.div`
  flex: 5;
  display: flex;
  gap: 8px;
  font-size: 1rem;
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
    background: ${({ isSelected }) => `${isSelected ? colors.white : colors.thickGlass}`};
  }

  padding: 3;
  line-height: 30px;
  background: ${({ isSelected }) => `${isSelected ? colors.thickGlass : colors.glass}`};
  width: 95%;
  border: 1px solid ${colors.gold};
  height: 60px;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  gap: 6px;
  line-height: 20px;
`;
