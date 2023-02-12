import { SyncState } from "@latticexyz/network";
import { useComponentValue, useObservableValue } from "@latticexyz/react";
import styled from "styled-components";
import { useMUD } from "../../MUDContext";
import { PlayerProvider } from "../../PlayerContext";
import { HoveredShip } from "../HoveredShip";
import { BootScreen } from "./BootScreen";
import { DamageChance } from "./DamageChance";
import { ComponentBrowser } from "./Dev/ComponentBrowser";
import { JoinGame } from "./JoinGame";
import { Modal } from "./Modals/Modal";
import { Settings } from "./Settings";
import { YourShips } from "./ShipStatus/YourShips";
import { TopBar } from "./TopBar";
import { TurnTimer } from "./TurnTimer";

export function Game() {
  const {
    components: { LoadingState, Player },
    godEntity,
    utils: { getPlayerEntity },
  } = useMUD();

  // re render when a player is added
  useObservableValue(Player.update$);
  const playerEntity = getPlayerEntity();
  const loadingState = useComponentValue(LoadingState, godEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });
  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={loadingState.percentage as number} />;

  return (
    <UIGrid
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
    >
      {playerEntity ? (
        <PlayerProvider value={playerEntity}>
          <TurnTimer />
          <TopBar />
          <Settings />
          <Modal />
          <HoveredShip />
          <YourShips />
          <DamageChance />
        </PlayerProvider>
      ) : (
        <JoinGame />
      )}
      <ComponentBrowser />
    </UIGrid>
  );
}

const UIGrid = styled.div`
  display: grid;
  overflow: hidden;
  grid-template-columns: repeat(12, 8.33%);
  grid-template-rows: repeat(12, 8.33%);
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
  z-index: 100;
`;