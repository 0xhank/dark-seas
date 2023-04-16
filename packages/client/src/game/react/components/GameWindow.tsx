import { SyncState } from "@latticexyz/network";
import { useComponentValue, useObservableValue } from "@latticexyz/react";
import styled from "styled-components";
import { useGame } from "../../../mud/providers/GameProvider";
import { OwnerProvider } from "../../../mud/providers/OwnerProvider";
import { BootScreen } from "./BootScreen";
import { DamageChance } from "./DamageChance";
import { ComponentBrowser } from "./Dev/ComponentBrowser";
import { EmergencyActions } from "./EmergencyActions";
import { HoveredShip } from "./HoveredShip";
import { Modal } from "./Modals/Modal";
import { FleetPage } from "./Registration/FleetPage";
import { SpectatePage } from "./Registration/SpectatePage";
import { Settings } from "./Settings";
import { SideBar } from "./SideBar";
import { TurnTimer } from "./TurnTimer";

export function GameWindow() {
  const {
    components: { LoadingState, Player },
    singletonEntity,

    utils: { getOwnerEntity, getPlayerEntity },
  } = useGame();

  // re render when a player is added
  useObservableValue(Player.update$);
  const ownerEntity = getOwnerEntity();
  const playerEntity = ownerEntity ? getPlayerEntity(ownerEntity) : undefined;
  console.log("player entity: ", playerEntity);
  const spectating = useComponentValue(Player, ownerEntity)?.value == -1;
  const loadingState = useComponentValue(LoadingState, singletonEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  const progression =
    loadingState.state == SyncState.INITIAL ? loadingState.percentage : loadingState.state == SyncState.LIVE ? 100 : 0;
  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={progression} />;
  return (
    <UIGrid
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
    >
      {ownerEntity ? (
        <OwnerProvider value={ownerEntity}>
          {playerEntity ? (
            <>
              <TurnTimer />
              {!spectating && <SideBar />}
              <HoveredShip />
              <DamageChance />
              <EmergencyActions />
            </>
          ) : (
            <FleetPage />
          )}
        </OwnerProvider>
      ) : (
        <SpectatePage />
      )}
      <Modal />
      <Settings />
      <Modal />
      <ComponentBrowser />
      {/* <ActionQueue /> */}
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