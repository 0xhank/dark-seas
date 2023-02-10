import { useComponentValue, useObservableValue } from "@latticexyz/react";
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
import styled from "styled-components";
import { world } from "../../../../mud/world";
import { useMUD } from "../../../../MUDContext";
import { usePlayer } from "../../../../PlayerContext";
import { Category } from "../../../../sound";
import { ActionType, ModalType, Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { Cell } from "../engine/components";
import { Button, colors, ConfirmButton, Container } from "../styles/global";
import { YourShip } from "./YourShip";

const gridConfig = { gridRowStart: 9, gridRowEnd: 13, gridColumnStart: 1, gridColumnEnd: 13 };
export function YourShips() {
  const {
    components: {},
    network: { clock },
    utils: { getPlayerEntity, getPhase, getTurn },
    godEntity,
    actions: { Action },
    components: {
      SelectedShip,
      SelectedMove,
      SelectedActions,
      EncodedCommitment,
      CommittedMove,
      HealthLocal,
      ModalOpen,
      Player,
      Ship,
      OwnedBy,
      LastMove,
      LastAction,
    },
    api: { commitMove, revealMove, submitActions, respawn: apiRespawn },
    utils: { getPlayerShipsWithMoves, getPlayerShipsWithActions, playSound, clearComponent, getGameConfig },
  } = useMUD();

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
    const encoding = useComponentValue(EncodedCommitment, godEntity)?.value;
    if (encoding) revealMove(encoding);
  };

  useObservableValue(clock.time$);
  const phase: Phase | undefined = getPhase(DELAY);
  const currentTurn = getTurn();

  const playerEntity = usePlayer();

  const respawnAllowed = !!getGameConfig()?.respawnAllowed;

  const selectedShip = useComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;

  const allYourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

  const yourShips = allYourShips.filter((shipEntity) => useComponentValue(HealthLocal, shipEntity)?.value);

  const respawn = () => apiRespawn(allYourShips);

  const encodedCommitment = useComponentValue(EncodedCommitment, godEntity)?.value;

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
    console.log("selectedActions", selectedActions);
    cannotAct =
      !acted &&
      (selectedActions.length == 0 ||
        selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
  }

  const showExecuting = txExecuting && !acted;

  const disabled = tooEarly || cannotAct || yourShips.length == 0;

  const movesComplete = yourShips.every((shipEntity) => {
    const committedMove = useComponentValue(CommittedMove, shipEntity)?.value;
    const selectedMove = useComponentValue(SelectedMove, shipEntity)?.value;
    return committedMove == selectedMove;
  });

  const removeActions = () => clearComponent(SelectedActions);

  const removeMoves = () => clearComponent(SelectedMove);

  const isOpen = !!useComponentValue(ModalOpen, ModalType.BOTTOM_BAR, { value: true }).value;

  const toggleOpen = () => setComponent(ModalOpen, ModalType.BOTTOM_BAR, { value: !isOpen });

  const RevealButtons = () => {
    if (acted) return <Success>Move reveal successful!</Success>;
    if (!encodedCommitment) return <Success>No moves to reveal</Success>;
    return (
      <ConfirmButton style={{ width: "100%", fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitExecute}>
        Reveal Moves
      </ConfirmButton>
    );
  };

  const CommitButtons = () => {
    if (movesComplete && encodedCommitment) {
      return <Success>Moves Successful!</Success>;
    }
    return (
      <>
        <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitCommitment}>
          Confirm Moves
          {someShipUnselected && (
            <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
              You haven't selected a move for one of your ships!
            </p>
          )}
        </ConfirmButton>
        <ConfirmButton noGoldBorder onClick={removeMoves} style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}>
          Clear
        </ConfirmButton>
      </>
    );
  };

  const ActionButtons = () => {
    if (acted) {
      return <Success>Actions Successful</Success>;
    } else {
      return (
        <>
          <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitActions}>
            <p>Submit Actions</p>
            {someShipUnselected && (
              <p style={{ color: colors.darkerGray, fontSize: "0.75rem" }}>
                You haven't selected actions for one of your ships!
              </p>
            )}
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
  if (showExecuting) content = <Success>Executing...</Success>;
  else if (phase == Phase.Reveal) content = <RevealButtons />;
  else if (phase == Phase.Commit) content = <CommitButtons />;
  else if (phase == Phase.Action) content = <ActionButtons />;

  return (
    <Cell style={gridConfig}>
      <div id="phaser-game" />
      <Container style={{ justifyContent: "flex-end", padding: "0", pointerEvents: "none" }}>
        <MoveButtons isOpen={isOpen}>
          <OpenCloseButton onClick={toggleOpen}>{isOpen ? "hide" : "show"}</OpenCloseButton>
          {yourShips.length == 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: colors.white, fontSize: "2rem" }}>You have no ships!</span>
              {respawnAllowed && <Button onClick={respawn}>Respawn</Button>}
            </div>
          ) : (
            yourShips.map((shipEntity) => (
              <YourShip
                key={`shipEntity-${shipEntity}`}
                shipEntity={shipEntity}
                selectedShip={selectedShip}
                phase={phase}
              />
            ))
          )}
          <ConfirmButtonsContainer hide={disabled}>{disabled ? null : content}</ConfirmButtonsContainer>
        </MoveButtons>
      </Container>
    </Cell>
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
