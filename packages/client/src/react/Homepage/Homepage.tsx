import { useState } from "react";
import styled from "styled-components";
import { BackgroundImg, Button } from "../styles/global";
import { JoinGame } from "./JoinGame";

const configData = {
  commitPhaseLength: 25,
  revealPhaseLength: 9,
  actionPhaseLength: 25,
  worldSize: 120,
  perlinSeed: 345676,
  entryCutoffTurns: 60,
  buyin: 0,
  respawnAllowed: false,
  shrinkRate: 0,
  budget: 5,
};

type ModalOpen = "Create" | "Join" | undefined;

export function HomePage() {
  const [modalOpen, setModalOpen] = useState<ModalOpen>();

  async function sendMessage() {
    try {
      const response = await fetch(`http://localhost:3001/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.text();
    } catch (e) {
      console.log("error:", e);
    }
  }

  return (
    <Container>
      <BackgroundImg style={{ zIndex: -1 }} />
      {modalOpen == "Create" && (
        <Modal onClick={() => setModalOpen(undefined)}>
          <div>Create</div>
        </Modal>
      )}
      {modalOpen == "Join" && (
        <Modal onClick={() => setModalOpen(undefined)}>
          <JoinGame />
        </Modal>
      )}
      <div
        style={{
          height: "79%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "19px",
        }}
      >
        <Logo src="/img/ds-logo.png" />
        <div style={{ display: "flex", width: "100%", gap: "6px" }}>
          <Button style={{ flex: 1, fontSize: "1.5rem" }} onClick={() => setModalOpen("Create")}>
            Create Game
          </Button>
          <Button style={{ flex: 1, fontSize: "1.5rem" }} onClick={() => setModalOpen("Join")} secondary>
            Join Game
          </Button>
        </div>
      </div>
    </Container>
  );
}

const Logo = styled.img`
  height: 74%;
`;
const Container = styled.div`
  width: 99vw;
  height: 99vh;
  position: absolute;
  top: -1;
  left: -1;  
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  grid-gap: 15px;
  z-index: 500;
x
  pointer-events: all;
  color: white;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: hsla(0, 0%, 0%, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
`;