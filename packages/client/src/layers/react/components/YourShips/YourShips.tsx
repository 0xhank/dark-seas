import { GodID } from "@latticexyz/network";
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
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { Action, Phase } from "../../../../types";
import { registerUIComponent } from "../../engine";
import { Button, colors, ConfirmButton, Container, InternalContainer } from "../../styles/global";
import { YourShip } from "./ShipData";

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
          utils: { getPlayerEntity, getPhase, getTurn },
        },
        phaser: {
          components: { SelectedShip, SelectedMove, Selection, SelectedActions, CommittedMoves },
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
        LastAction.update$,
        CommittedMoves.update$
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
            CommittedMoves,
            world,
            camera,
            positions,
            connectedAddress,
            revealMove,
            getPlayerEntity,
            getPhase,
            submitActions,
            getTurn,
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
        CommittedMoves,
        world,
        connectedAddress,
        getPlayerEntity,
        getPhase,
        revealMove,
        submitActions,
        getTurn,
        commitMove,
      } = props;

      const phase: Phase | undefined = getPhase();
      const currentTurn = getTurn();

      if (phase == undefined || currentTurn == undefined) return null;

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
          if (phase == Phase.Commit) {
            const encodedMove = abi.encode(
              ["uint256[]", "uint256[]", "uint256"],
              [shipsAndMoves.ships, shipsAndMoves.moves, 0]
            );
            commitMove(encodedMove);
            setComponent(CommittedMoves, GodEntityIndex, { value: encodedMove });
          } else {
            const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
            if (!encoding) return;
            revealMove(encoding);
          }
        }
      };

      const ConfirmButtons = () => {
        const committedMoves = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
        if (phase == Phase.Reveal) {
          const bgColor = lastMove == currentTurn ? colors.confirmed : !committedMoves ? colors.glass : colors.waiting;
          return (
            <ConfirmButtonsContainer
              style={{
                background: bgColor,
                justifyContent: "center",
                color: colors.white,
                borderRadius: "6px",
              }}
            >
              {lastMove == currentTurn
                ? "Move execution successful!"
                : !committedMoves
                ? "No moves to execute"
                : "Executing moves..."}
            </ConfirmButtonsContainer>
          );
        } else if (phase == Phase.Commit || (phase == Phase.Action && lastAction != currentTurn)) {
          const content =
            phase == Phase.Commit ? (committedMoves ? "Commit Updated Moves" : "Commit Moves") : "Submit Actions";
          return (
            <ConfirmButtonsContainer>
              <Button
                disabled={disabled}
                noGoldBorder
                onClick={() => {
                  yourShips.map((entity) => {
                    phase == Phase.Commit
                      ? removeComponent(SelectedMove, entity)
                      : removeComponent(SelectedActions, entity);
                  });
                }}
                style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
              >
                Clear
              </Button>
              <ConfirmButton
                disabled={disabled}
                style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                onClick={handleSubmit}
              >
                {content}
              </ConfirmButton>
            </ConfirmButtonsContainer>
          );
        } else {
          return (
            <ConfirmButtonsContainer
              style={{ background: "hsla(120, 100%, 50%, .5", justifyContent: "center", color: colors.white }}
            >
              Actions Successful
            </ConfirmButtonsContainer>
          );
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
            <ConfirmButtons />
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

const ConfirmButtonsContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  flex-direction: column-reverse;
  gap: 5px;
`;
