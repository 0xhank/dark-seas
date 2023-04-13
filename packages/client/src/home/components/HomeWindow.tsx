import { SyncState } from "@latticexyz/network";
import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID } from "@latticexyz/recs";
import styled from "styled-components";
import { BootScreen } from "../../game/react/components/BootScreen";
import { ActionQueue } from "../../game/react/components/Dev/ActionQueue";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { OwnerProvider } from "../../mud/providers/OwnerProvider";
import { BackgroundImg, ShipContainer } from "../../styles/global";
import { world } from "../../world";
import { CreateGame } from "./CreateGame";
import { Games } from "./Games";
import { RegisterName } from "./RegisterName";
import { ShipShop } from "./ShipShop";
import { TabbedView } from "./TabbedView";
import { YourPort } from "./YourPort";

export function HomeWindow() {
  const {
    singletonEntity,
    ownerAddress,
    components: { LoadingState, Player, Name },
  } = useNetwork();

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

  const tabs = [
    { name: "Live Games", component: <Games /> },
    { name: "Create Game", component: <CreateGame /> },
    { name: "Your Port", component: <YourPort /> },
    { name: "Ship Shop", component: <ShipShop /> },
  ];
  return (
    <HomeContainer>
      <BackgroundImg src="img/ship-background.png" style={{ zIndex: -1 }} />
      <ActionQueue />
      <RegisterContainer>
        {ownerEntity ? (
          <OwnerProvider value={ownerEntity}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <strong style={{ fontSize: "1.5rem" }}> Welcome, {name}</strong>
              <TabbedView tabs={tabs} />
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
  width: 80%;
  height: 80%;
  transform: translate(-50%, -50%);
  padding: 12px;
  cursor: auto;
  pointer-events: all;
  display: flex;
  justify-content: center;
`;
