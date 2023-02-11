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
import { world } from "../../mud/world";
import { useMUD } from "../../MUDContext";
import { usePlayer } from "../../PlayerContext";
import { ActionType, DELAY, ModalType, Phase } from "../../types";
import { Button, colors, Container } from "../styles/global";
import { ActionButtons } from "./ActionButtons";
import { Cell } from "./Cell";
import { CommitButtons } from "./CommitButtons";
import { RevealButtons } from "./RevealButtons";
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
      HealthLocal,
      ModalOpen,
      OwnedBy,
      LastAction,
      Ship,
    },
    api: { respawn: apiRespawn },
    utils: { getGameConfig },
  } = useMUD();

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
  if (phase == Phase.Commit) {
    const selectedMoves = [...getComponentEntities(SelectedMove)];
    acted = encodedCommitment !== undefined;
    cannotAct = selectedMoves.length == 0;
  } else if (phase == Phase.Action) {
    const selectedActions = [...getComponentEntities(SelectedActions)].map((entity) =>
      getComponentValueStrict(SelectedActions, entity)
    );
    acted = getComponentValue(LastAction, playerEntity)?.value == currentTurn;
    cannotAct =
      !acted &&
      (selectedActions.length == 0 ||
        selectedActions.every((arr) => arr.actionTypes.every((elem) => elem == ActionType.None)));
  }

  const showExecuting = txExecuting && !acted;

  const disabled = tooEarly || cannotAct || yourShips.length == 0;

  const isOpen = !!useComponentValue(ModalOpen, ModalType.BOTTOM_BAR, { value: true }).value;

  const toggleOpen = () => setComponent(ModalOpen, ModalType.BOTTOM_BAR, { value: !isOpen });

  let content = null;
  if (showExecuting) content = <Success>Executing...</Success>;
  else if (phase == Phase.Reveal) content = <RevealButtons />;
  else if (phase == Phase.Commit) content = <CommitButtons yourShips={yourShips} />;
  else if (phase == Phase.Action) content = <ActionButtons yourShips={yourShips} />;

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
