import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  NotValue,
  runQuery,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { ActionType, Phase } from "../../../../types";
import { Category } from "../../../backend/sound/library";
import { DELAY } from "../../constants";
import { registerUIComponent } from "../engine";
import { colors, ConfirmButton, Container } from "../styles/global";
import { YourShip } from "./YourShip";

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
            ExecutedActions,
          },
          api: { commitMove, revealMove, submitActions },
          utils: { getPlayerShipsWithMoves, getPlayerShipsWithActions, playSound, clearComponent },
        },
      } = layers;

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

          const moved = getComponentValue(LastMove, playerEntity)?.value == currentTurn;
          const acted = getComponentValue(LastAction, playerEntity)?.value == currentTurn;

          const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;

          const yourShips = [
            ...runQuery([
              Has(Ship),
              HasValue(OwnedBy, { value: world.entities[playerEntity] }),
              NotValue(HealthLocal, { value: 0 }),
            ]),
          ];

          const selectedMoves = [...getComponentEntities(SelectedMove)];
          const actionsExecuted = [...getComponentEntities(ExecutedActions)].length > 0;
          const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
            getComponentValueStrict(SelectedActions, entity)
          );

          const tooEarly = getPhase() !== phase;
          const disabled =
            tooEarly ||
            (phase == Phase.Commit
              ? selectedMoves.length == 0
              : !actionsExecuted &&
                (selectedActions.length == 0 ||
                  selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None))));

          const actionExecuting = !![...runQuery([Has(Action)])].find((entity) => {
            const state = getComponentValueStrict(Action, entity).state;
            if (state == ActionState.Requested) return true;
            if (state == ActionState.Executing) return true;
            if (state == ActionState.WaitingForTxEvents) return true;
            return false;
          });
          const encodedCommitment = getComponentValue(EncodedCommitment, godEntity)?.value;

          const movesComplete = yourShips.every((ship) => {
            const committedMove = getComponentValue(CommittedMove, ship)?.value;
            const selectedMove = getComponentValue(SelectedMove, ship)?.value;
            return committedMove == selectedMove;
          });

          const removeActions = () => clearComponent(SelectedActions);

          const removeMoves = () => clearComponent(SelectedMove);

          return {
            layers,
            yourShips,
            selectedShip,
            phase,
            actionExecuting,
            encodedCommitment,
            movesComplete,
            handleSubmitExecute,
            moved,
            acted,
            disabled,
            handleSubmitCommitment,
            handleSubmitActions,
            removeActions,
            removeMoves,
          };
        })
      );
    },
    // render
    (props) => {
      const {
        layers,
        yourShips,
        selectedShip,
        phase,
        moved,
        acted,
        disabled,
        handleSubmitCommitment,
        handleSubmitActions,
        actionExecuting,
        encodedCommitment,
        movesComplete,
        handleSubmitExecute,
        removeActions,
        removeMoves,
      } = props;

      const RevealButtons = () => {
        if (moved) return <Success background={colors.greenGlass}>Move reveal successful!</Success>;
        if (!encodedCommitment) return <Success background={colors.glass}>No moves to reveal</Success>;
        return (
          <ConfirmButton style={{ fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitExecute}>
            Reveal Moves
          </ConfirmButton>
        );
      };

      const CommitButtons = () => {
        const msg = "Confirm Moves";

        if (movesComplete && encodedCommitment) {
          return <Success background="hsla(120, 100%, 50%, .5)">Moves Successful!</Success>;
        }
        return (
          <>
            <ConfirmButton
              style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
              onClick={handleSubmitCommitment}
            >
              {msg}
            </ConfirmButton>
            <ConfirmButton
              noGoldBorder
              onClick={removeMoves}
              style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
            >
              Clear
            </ConfirmButton>
          </>
        );
      };

      const ActionButtons = () => {
        if (acted) {
          return <Success background="hsla(120, 100%, 50%, .5)">Actions Successful</Success>;
        } else {
          return (
            <>
              <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitActions}>
                Submit Actions
              </ConfirmButton>
              <ConfirmButton
                noGoldBorder
                onClick={removeActions}
                style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
              >
                Clear
              </ConfirmButton>
            </>
          );
        }
      };
      let content = null;
      if (actionExecuting) content = <Success background={colors.waiting}>Executing...</Success>;
      else if (phase == Phase.Reveal) content = <RevealButtons />;
      else if (phase == Phase.Commit) content = <CommitButtons />;
      else if (phase == Phase.Action) content = <ActionButtons />;

      return (
        <Container style={{ justifyContent: "flex-end", padding: "0" }}>
          <MoveButtons>
            {yourShips.length == 0 ? (
              <span style={{ color: colors.white, fontSize: "2rem" }}>You have no ships!</span>
            ) : (
              yourShips.map((ship) => (
                <YourShip key={`ship-${ship}`} layers={layers} ship={ship} selectedShip={selectedShip} phase={phase} />
              ))
            )}
            <ConfirmButtonsContainer hide={disabled}>{disabled ? null : content}</ConfirmButtonsContainer>
          </MoveButtons>
        </Container>
      );
    }
  );
}

const Success = styled.div<{ background: string }>`
  color: ${colors.white};
  border-radius: 6px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const MoveButtons = styled.div`
  height: auto;
  background: ${colors.darkBrown};
  border-radius: 20px 20px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  max-width: 100vw;
  gap: 12px;
  padding: 12px;
  font-weight: 700;
`;

const ConfirmButtonsContainer = styled.div<{ hide: boolean }>`
  position: absolute;
  margin: 0 auto;
  top: 6px;
  z-index: -1;
  display: flex;
  gap: 6px;
  background: ${colors.darkBrown};
  min-height: 70px;
  border-radius: 6px 6px 0 0;
  transform: ${({ hide }) => (hide ? "translateY(0)" : "translateY(-70px)")};
  transition: all 0.2s ease-out;
  width: 500px;

  padding: 6px;
`;
