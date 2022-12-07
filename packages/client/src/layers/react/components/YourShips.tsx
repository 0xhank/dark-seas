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
} from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { GodID } from "@latticexyz/network";
import { Container, Button, ConfirmButton, InternalContainer, colors, BoxImage } from "../styles/global";
import { Action, Phase } from "../../../constants";
import styled from "styled-components";
import { YourShip } from "./YourShips/ShipData";

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
            layers,
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
        layers,
        SelectedMove,
        SelectedShip,
        Selection,
        Wind,
        Ship,
        Player,
        OwnedBy,
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

      const phase: Phase | undefined = getCurrentGamePhase();
      const currentTurn = getCurrentGameTurn();

      if (phase == undefined || currentTurn == undefined) return null;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const lastMove = getComponentValue(LastMove, playerEntity)?.value;
      const lastAction = getComponentValue(LastAction, playerEntity)?.value;

      console.log("current turn:", currentTurn);
      console.log("last move:", lastMove);
      console.log("current action:", lastAction);

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
        phase == Phase.Commit
          ? selectedMoves.length == 0
          : selectedActions.length == 0 || selectedActions?.every((arr) => arr?.every((elem) => elem == -1));

      const handleSubmit = () => {
        if (phase == Phase.Action) {
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
          phase == Phase.Commit
            ? commitMove(shipsAndMoves.ships, shipsAndMoves.moves)
            : revealMove(shipsAndMoves.ships, shipsAndMoves.moves);
        }
      };

      return (
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer style={{ gap: "24px", height: "auto" }}>
            <MoveButtons>
              {yourShips.map((ship) => (
                <YourShip
                  key={`ship-${ship}`}
                  layers={layers}
                  ship={ship}
                  selectedShip={selectedShip}
                  wind={wind}
                  selection={selection}
                  phase={phase}
                />
              ))}
            </MoveButtons>
            {(phase == Phase.Commit && lastMove != currentTurn) ||
            (phase == Phase.Action && lastAction != currentTurn) ? (
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
                <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmit}>
                  {phase == Phase.Commit ? "Commit Moves" : phase == Phase.Action ? "Submit Actions" : "Reveal Moves"}
                </ConfirmButton>
              </ConfirmButtons>
            ) : (
              <ConfirmButtons
                style={{ background: "hsla(120, 100%, 50%, .5", justifyContent: "center", color: colors.white }}
              >
                {phase == Phase.Commit ? "Commitments Confirmed" : "Actions Confirmed"}
              </ConfirmButtons>
            )}
          </InternalContainer>
        </Container>
      );
    }
  );
}

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

const ConfirmedContainer = styled.div`
  width: 100%;
  height: 100%;
  color: green;
`;
