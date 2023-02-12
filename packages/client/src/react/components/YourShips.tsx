import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, getComponentValue, Has, HasValue, runQuery, setComponent } from "@latticexyz/recs";
import { merge } from "rxjs";
import styled from "styled-components";
import { world } from "../../mud/world";
import { useMUD } from "../../MUDContext";
import { usePlayer } from "../../PlayerContext";
import { ModalType, Phase } from "../../types";
import { ConfirmButtons } from "../ConfirmButtons";
import { Button, colors, Container } from "../styles/global";
import { Cell } from "./Cell";
import { YourShip } from "./YourShip";

const gridConfig = { gridRowStart: 9, gridRowEnd: 13, gridColumnStart: 1, gridColumnEnd: 13 };
export function YourShips() {
  const {
    components: {},
    network: { clock },
    utils: { getPhase, getTurn },
    godEntity,
    components: { SelectedShip, HealthLocal, ModalOpen, OwnedBy, Ship },
    api: { respawn: apiRespawn },
    utils: { getGameConfig },
  } = useMUD();

  const time = useObservableValue(clock.time$) || 0;
  const phase: Phase | undefined = getPhase(time);

  useObservableValue(merge(HealthLocal.update$));

  const playerEntity = usePlayer();

  const respawnAllowed = !!getGameConfig()?.respawnAllowed;

  const selectedShip = useComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;

  const allYourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

  const yourShips = allYourShips.filter((shipEntity) => getComponentValue(HealthLocal, shipEntity)?.value);

  const respawn = () => apiRespawn(allYourShips);

  const isOpen = !!useComponentValue(ModalOpen, ModalType.BOTTOM_BAR, { value: true }).value;

  const toggleOpen = () => setComponent(ModalOpen, ModalType.BOTTOM_BAR, { value: !isOpen });

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
          <ConfirmButtons />
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
