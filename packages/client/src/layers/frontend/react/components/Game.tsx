import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import { useState } from "react";
import styled from "styled-components";
import { useMUD } from "../../../../MUDContext";
import { BootScreen } from "../engine";
import { HoveredShip } from "./HoveredShip";
import { JoinGame } from "./JoinGame";
import { Modal } from "./Modal/Modal";
import { Settings } from "./Settings";
import { TopBar } from "./TopBar";
import { TurnTimer } from "./TurnTimer";
import { YourShips } from "./YourShips";

export function Game() {
  const {
    components: { LoadingState },
    godEntity,
    initialPlayerEntity,
  } = useMUD();
  const [playerEntity, setPlayerEntity] = useState(initialPlayerEntity);
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
        <>
          <TurnTimer />
          <TopBar />
          <Settings />
          <Modal />
          <HoveredShip />
          <YourShips />
        </>
      ) : (
        <JoinGame />
      )}
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
