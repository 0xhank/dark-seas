import { SyncState } from "@latticexyz/network";
import { useComponentValue } from "@latticexyz/react";
import styled from "styled-components";
import { JoinGame } from "./layers/frontend/react/components/JoinGame";
import { TopBar } from "./layers/frontend/react/components/TopBar";
import { TurnTimer } from "./layers/frontend/react/components/TurnTimer";
import { BootScreen } from "./layers/frontend/react/engine";
import { useMUD } from "./MUDContext";
import { createBackendSystems } from "./systems/backend";
import { createPhaserSystems } from "./systems/phaser";

export const App = () => {
  const {
    components: { LoadingState },
    godEntity,
  } = useMUD();

  const loadingState = useComponentValue(LoadingState, godEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  createBackendSystems();
  createPhaserSystems();

  console.log("loadingstate:", loadingState);
  return (
    <>
      {loadingState.state !== SyncState.LIVE ? (
        <BootScreen progression={loadingState.percentage as number} />
      ) : (
        <UIGrid
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseOver={(e) => e.stopPropagation()}
        >
          <JoinGame />
          <TurnTimer />
          <TopBar />
        </UIGrid>
      )}
    </>
  );
};

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
