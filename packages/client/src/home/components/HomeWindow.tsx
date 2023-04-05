import { SyncState } from "@latticexyz/network";
import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID } from "@latticexyz/recs";
import styled from "styled-components";
import { BootScreen } from "../../game/react/components/BootScreen";
import { ActionQueue } from "../../game/react/components/Dev/ActionQueue";
import { useHome } from "../../mud/providers/HomeProvider";
import { OwnerProvider } from "../../mud/providers/OwnerProvider";
import { BackgroundImg, ShipContainer } from "../../styles/global";
import { world } from "../../world";
import { CreateGame } from "./CreateGame";
import { Games } from "./Games";
import { RegisterName } from "./RegisterName";
import { YourPort } from "./YourPort";

export function HomeWindow() {
  const {
    singletonEntity,
    worldAddress,
    ownerAddress,
    components: { LoadingState, Player, Name },
  } = useHome();

  useObservableValue(Player.update$);
  const ownerEntity = world.entityToIndex.get(ownerAddress as EntityID);
  const name = useComponentValue(Name, ownerEntity)?.value;
  const loadingState = useComponentValue(LoadingState, singletonEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  const progression =
    loadingState.state == SyncState.INITIAL ? loadingState.percentage : loadingState.state == SyncState.LIVE ? 100 : 0;
  if (loadingState.state !== SyncState.LIVE) return <BootScreen progression={progression} />;

  return (
    <HomeContainer>
      <BackgroundImg src="img/ship-background.png" style={{ zIndex: -1 }} />
      <ActionQueue home />
      <RegisterContainer>
        {ownerEntity ? (
          <OwnerProvider value={ownerEntity}>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
              <strong style={{ fontSize: "1.5rem" }}> Welcome, {name}</strong>
              <div style={{ display: "flex" }}>
                <CreateGame />
                <Games />
                <YourPort />
              </div>
            </div>
          </OwnerProvider>
        ) : (
          <RegisterName />
        )}
      </RegisterContainer>
    </HomeContainer>
  );
}

const HomeContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  gap: 6px;
`;

const RegisterContainer = styled(ShipContainer)`
  position: absolute;
  top: 50%;
  left: 50%;
  overflow: hidden;
  transform: translate(-50%, -50%);
  padding: 12px;
  cursor: auto;
  pointer-events: all;
  height: 60%;
  display: flex;
  flex-direction: row;
`;
