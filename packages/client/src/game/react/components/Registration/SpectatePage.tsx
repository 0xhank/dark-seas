import { EntityID, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useGame } from "../../../../mud/providers/GameProvider";
import { Button, ShipContainer } from "../../../../styles/global";
import { world } from "../../../../world";
import { ModalType } from "../../../types";

export function SpectatePage() {
  const {
    components: { ModalOpen, Player },
    ownerAddress,
  } = useGame();

  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });
  const spectate = () => {
    const ownerEntity = world.registerEntity({ id: ownerAddress as EntityID });
    // setting player to -1 tells Game.tsx that we are spectating
    setComponent(Player, ownerEntity, { value: -1 });
  };
  return (
    <RegisterContainer>
      <SpectateContainer>
        <h1 style={{ fontSize: "2.5rem", lineHeight: "3rem" }}>Welcome to Dark Seas</h1>
        <div style={{ display: "flex", gap: "8px", minWidth: "33%" }}>
          <Button style={{ flex: 1 }} secondary onClick={openTutorial}>
            How to Play
          </Button>
          <Button style={{ flex: 1 }} secondary onClick={spectate}>
            Spectate
          </Button>
        </div>
      </SpectateContainer>
    </RegisterContainer>
  );
}

const RegisterContainer = styled(ShipContainer)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  cursor: auto;
  pointer-events: all;
`;

const SpectateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
`;
