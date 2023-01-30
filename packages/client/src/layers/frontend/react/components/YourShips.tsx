import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { ActionType, Phase } from "../../../../types";
import { Category } from "../../../backend/sound/library";
import { DELAY } from "../../constants";
import { registerUIComponent } from "../engine";
import { colors, ConfirmButton, Container, InternalContainer } from "../styles/global";
import { YourShip } from "./YourShip";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 8,
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
            Position,
            Player,
            Firepower,
            Ship,
            OwnedBy,
            LastMove,
            LastAction,
            Loaded,
            Speed,
          },
          network: { connectedAddress, clock },
          utils: { getPlayerEntity, getPhase, getTurn },
        },
        backend: {
          godEntity,
          actions: { Action },
          components: {
            SelectedShip,
            SelectedMove,
            SelectedActions,
            EncodedCommitment,
            HoveredShip,
            CommittedMove,
            HealthLocal,
            OnFireLocal: OnFire,
            DamagedCannonsLocal: DamagedCannons,
            SailPositionLocal: SailPosition,
          },
          api: { commitMove, revealMove, submitActions },
          utils: { getPlayerShipsWithMoves, getPlayerShipsWithActions, playSound },
        },
      } = layers;

      return merge(
        clock.time$,
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        HoveredShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$,
        Player.update$,
        HealthLocal.update$,
        DamagedCannons.update$,
        Firepower.update$,
        OnFire.update$,
        Ship.update$,
        SelectedActions.update$,
        OwnedBy.update$,
        LastMove.update$,
        LastAction.update$,
        EncodedCommitment.update$,
        Loaded.update$,
        Action.update$,
        CommittedMove.update$,
        Speed.update$
      ).pipe(
        map(() => {
          const phase: Phase | undefined = getPhase(DELAY);
          const currentTurn = getTurn();

          if (phase == undefined || currentTurn == undefined) return null;

          const playerEntity = getPlayerEntity(connectedAddress.get());
          if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

          const lastMove = getComponentValue(LastMove, playerEntity)?.value;
          const lastAction = getComponentValue(LastAction, playerEntity)?.value;

          const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;

          const yourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

          const selectedMoves = [...getComponentEntities(SelectedMove)];
          const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
            getComponentValueStrict(SelectedActions, entity)
          );

          const disabled =
            phase == Phase.Commit
              ? selectedMoves.length == 0
              : selectedActions.length == 0 ||
                selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None));

          const handleSubmitActions = () => {
            const shipsAndActions = getPlayerShipsWithActions();
            if (!shipsAndActions) return;
            playSound("click", Category.UI);

            submitActions(shipsAndActions);
          };

          const handleSubmitCommitment = () => {
            const shipsAndMoves = getPlayerShipsWithMoves();
            if (!shipsAndMoves) return;

            playSound("click", Category.UI);

            commitMove(shipsAndMoves);
          };

          const handleSubmitExecute = () => {
            const encoding = getComponentValue(EncodedCommitment, godEntity)?.value;
            if (encoding) revealMove(encoding);
          };

          const RevealButtons = () => {
            const encodedCommitment = getComponentValue(EncodedCommitment, godEntity)?.value;

            if (lastMove == currentTurn)
              return <Success background={colors.greenGlass}>Move reveal successful!</Success>;
            if (!encodedCommitment) return <Success background={colors.glass}>No moves to reveal</Success>;
            return (
              <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitExecute}>
                Reveal Moves
              </ConfirmButton>
            );
          };

          const CommitButtons = () => {
            const movesComplete = yourShips.every((ship) => {
              const committedMove = getComponentValue(CommittedMove, ship)?.value;
              const selectedMove = getComponentValue(SelectedMove, ship)?.value;
              return committedMove == selectedMove;
            });

            const msg = "Confirm Moves";
            const committedMoves = getComponentValue(EncodedCommitment, godEntity)?.value;

            if (movesComplete && committedMoves) {
              return <Success background="hsla(120, 100%, 50%, .5)">Moves Successful!</Success>;
            }
            return (
              <>
                <ConfirmButton
                  disabled={disabled}
                  style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                  onClick={handleSubmitCommitment}
                >
                  {msg}
                </ConfirmButton>
                <ConfirmButton
                  disabled={disabled}
                  noGoldBorder
                  onClick={() => {
                    yourShips.map((entity) => removeComponent(SelectedMove, entity));
                    removeComponent(SelectedShip, godEntity);
                  }}
                  style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
                >
                  Clear
                </ConfirmButton>
              </>
            );
          };

          const ActionButtons = () => {
            if (lastAction == currentTurn) {
              return <Success background="hsla(120, 100%, 50%, .5)">Actions Successful</Success>;
            } else {
              return (
                <>
                  <ConfirmButton
                    disabled={disabled}
                    style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                    onClick={handleSubmitActions}
                  >
                    Submit Actions
                  </ConfirmButton>
                  <ConfirmButton
                    disabled={disabled}
                    noGoldBorder
                    onClick={() => {
                      yourShips.map((entity) => removeComponent(SelectedActions, entity));
                      removeComponent(SelectedShip, godEntity);
                    }}
                    style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
                  >
                    Clear
                  </ConfirmButton>
                </>
              );
            }
          };

          const ConfirmButtons = () => {
            let content: JSX.Element | null = null;
            const actionExecuting = !![...runQuery([Has(Action)])].find((entity) => {
              const state = getComponentValueStrict(Action, entity).state;
              if (state == ActionState.Requested) return true;
              if (state == ActionState.Executing) return true;
              if (state == ActionState.WaitingForTxEvents) return true;
              return false;
            });
            if (actionExecuting) content = <Success background={colors.waiting}>Executing...</Success>;
            else if (phase == Phase.Reveal) content = <RevealButtons />;
            else if (phase == Phase.Commit) content = <CommitButtons />;
            else if (phase == Phase.Action) content = <ActionButtons />;

            return <ConfirmButtonsContainer>{content}</ConfirmButtonsContainer>;
          };

          return {
            layers,
            yourShips,
            selectedShip,
            phase,
            ConfirmButtons,
          };
        })
      );
    },
    // render
    (props) => {
      const { layers, yourShips, selectedShip, phase, ConfirmButtons } = props;

      return (
        <Container style={{ justifyContent: "flex-end", padding: "0" }}>
          <div style={{ width: "100vw", height: "100%", background: colors.darkBrown, borderRadius: "20px 20px 0 0" }}>
            <InternalContainer style={{ gap: "24px", height: "100%", background: "transparent" }}>
              <MoveButtons>
                {yourShips.map((ship) => (
                  <YourShip
                    key={`ship-${ship}`}
                    layers={layers}
                    ship={ship}
                    selectedShip={selectedShip}
                    phase={phase}
                  />
                ))}
              </MoveButtons>
              <ConfirmButtons />
            </InternalContainer>
          </div>
        </Container>
      );
    }
  );
}

const Success = styled.div<{ background: string }>`
  background: ${({ background }) => background};
  color: ${colors.white};
  border-radius: 6px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const MoveButtons = styled.div`
  flex: 5;
  display: flex;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  max-width: 90%;
`;

const ConfirmButtonsContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
`;
