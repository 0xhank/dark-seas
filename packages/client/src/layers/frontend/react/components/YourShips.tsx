import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { ActionType, ModalType, Phase } from "../../../../types";
import { Category } from "../../../backend/sound/library";
import { DELAY } from "../../constants";
import { registerUIComponent } from "../engine";
import { Button, colors, ConfirmButton, Container } from "../styles/global";
import { YourShip } from "./YourShip";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid position
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
            ModalOpen,
          },
          api: { commitMove, revealMove, submitActions, respawn: apiRespawn },
          utils: { getPlayerShipsWithMoves, getPlayerShipsWithActions, playSound, clearComponent, getGameConfig },
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
        Speed.update$,
        ModalOpen.update$
      ).pipe(
        map(() => {
          const phase: Phase | undefined = getPhase(DELAY);
          const currentTurn = getTurn();

          if (phase == undefined || currentTurn == undefined) return null;

          const playerEntity = getPlayerEntity(connectedAddress.get());
          if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

          const respawnAllowed = !!getGameConfig()?.respawnAllowed;

          const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;

          const allYourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

          const yourShips = allYourShips.filter((ship) => getComponentValue(HealthLocal, ship)?.value);

          const respawn = () => apiRespawn(allYourShips);

          const encodedCommitment = getComponentValue(EncodedCommitment, godEntity)?.value;

          const tooEarly = getPhase() !== phase;

          const txExecuting = [...runQuery([Has(Action)])].length > 0;
          let cannotAct = false;
          let acted = false;
          let someShipUnselected = false;
          if (phase == Phase.Commit) {
            const selectedMoves = [...getComponentEntities(SelectedMove)];
            someShipUnselected = selectedMoves.length != yourShips.length;
            acted = encodedCommitment !== undefined;
            cannotAct = selectedMoves.length == 0;
          } else if (phase == Phase.Reveal) {
            acted = getComponentValue(LastMove, playerEntity)?.value == currentTurn;
          } else if (phase == Phase.Action) {
            const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
              getComponentValueStrict(SelectedActions, entity)
            );
            acted = getComponentValue(LastAction, playerEntity)?.value == currentTurn;
            someShipUnselected = selectedActions.length != yourShips.length;
            cannotAct =
              !acted &&
              (selectedActions.length == 0 ||
                selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
          }

          const showExecuting = txExecuting && !acted;

          const disabled = tooEarly || cannotAct || yourShips.length == 0;

          const movesComplete = yourShips.every((ship) => {
            const committedMove = getComponentValue(CommittedMove, ship)?.value;
            const selectedMove = getComponentValue(SelectedMove, ship)?.value;
            return committedMove == selectedMove;
          });

          const removeActions = () => clearComponent(SelectedActions);

          const removeMoves = () => clearComponent(SelectedMove);

          const isOpen = !!getComponentValue(ModalOpen, ModalType.BOTTOM_BAR)?.value;

          const toggleOpen = () => setComponent(ModalOpen, ModalType.BOTTOM_BAR, { value: !isOpen });

          return {
            layers,
            isOpen,
            yourShips,
            selectedShip,
            phase,
            showExecuting,
            encodedCommitment,
            movesComplete,
            respawnAllowed,
            acted,
            disabled,
            someShipUnselected,
            handleSubmitCommitment,
            handleSubmitExecute,
            handleSubmitActions,
            removeActions,
            removeMoves,
            toggleOpen,
            respawn,
          };
        })
      );
    },
    // render
    (props) => {
      const RevealButtons = () => {
        if (props.acted) return <Success>Move reveal successful!</Success>;
        if (!props.encodedCommitment) return <Success>No moves to reveal</Success>;
        return (
          <ConfirmButton
            style={{ width: "100%", fontSize: "1rem", lineHeight: "1.25rem" }}
            onClick={props.handleSubmitExecute}
          >
            Reveal Moves
          </ConfirmButton>
        );
      };

      const CommitButtons = () => {
        if (props.movesComplete && props.encodedCommitment) {
          return <Success>Moves Successful!</Success>;
        }
        return (
          <>
            <ConfirmButton
              style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
              onClick={props.handleSubmitCommitment}
            >
              Confirm Moves
              {props.someShipUnselected && (
                <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
                  You haven't selected a move for one of your ships!
                </p>
              )}
            </ConfirmButton>
            <ConfirmButton
              noGoldBorder
              onClick={props.removeMoves}
              style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
            >
              Clear
            </ConfirmButton>
          </>
        );
      };

      const ActionButtons = () => {
        if (props.acted) {
          return <Success>Actions Successful</Success>;
        } else {
          return (
            <>
              <ConfirmButton
                style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                onClick={props.handleSubmitActions}
              >
                <p>Submit Actions</p>
                {props.someShipUnselected && (
                  <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
                    You haven't selected actions for one of your ships!
                  </p>
                )}
              </ConfirmButton>
              <ConfirmButton
                noGoldBorder
                onClick={props.removeActions}
                style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
              >
                Clear
              </ConfirmButton>
            </>
          );
        }
      };
      let content = null;
      if (props.showExecuting) content = <Success>Executing...</Success>;
      else if (props.phase == Phase.Reveal) content = <RevealButtons />;
      else if (props.phase == Phase.Commit) content = <CommitButtons />;
      else if (props.phase == Phase.Action) content = <ActionButtons />;

      return (
        <Container style={{ justifyContent: "flex-end", padding: "0", pointerEvents: "none" }}>
          <MoveButtons isOpen={props.isOpen}>
            <OpenCloseButton onClick={props.toggleOpen}>{props.isOpen ? "hide" : "show"}</OpenCloseButton>
            {props.yourShips.length == 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: colors.white, fontSize: "2rem" }}>You have no ships!</span>
                {props.respawnAllowed && <Button onClick={props.respawn}>Respawn</Button>}
              </div>
            ) : (
              props.yourShips.map((ship) => (
                <YourShip
                  key={`ship-${ship}`}
                  layers={props.layers}
                  ship={ship}
                  selectedShip={props.selectedShip}
                  phase={props.phase}
                />
              ))
            )}
            <ConfirmButtonsContainer hide={props.disabled}>{props.disabled ? null : content}</ConfirmButtonsContainer>
          </MoveButtons>
        </Container>
      );
    }
  );
}

const Success = styled.div`
  color: ${colors.gold};
  border-radius: 6px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const MoveButtons = styled.div<{ isOpen: boolean }>`
  height: auto;
  background: ${colors.darkBrown};
  border-radius: 20px 20px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  min-width: 500px;
  max-width: 100vw;
  gap: 12px;
  padding: 12px;
  padding-top: 20px;
  font-weight: 700;
  position: relative;
  transform: ${({ isOpen }) => (isOpen ? "translateY(0)" : "translateY(calc(100% - 19px))")};
  transition: all 0.2s ease-out;
  pointer-events: all;
`;

const OpenCloseButton = styled.button`
  position: absolute;
  color: white;
  z-index: 10;
  top: 0;
  background: none;
  border-radius: 2px;
  right: 12px;
  height: 20px;
  display: flex;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  color: ${colors.gold};
  width: calc(100% - 24px);
  display: flex;
  justify-content: flex-end;
  :focus {
    outline: 0;
  }
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
  border-radius: 10px 10px 0 0;
  transform: ${({ hide }) => (hide ? "translateY(0)" : "translateY(-70px)")};
  transition: all 0.2s ease-out;
  width: 500px;

  padding: 6px;
`;
