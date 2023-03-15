import { useState } from "react";
import styled from "styled-components";
import { BackgroundImg, Button } from "../styles/global";
import { CreateGame } from "./CreateGame";
import { JoinGame } from "./JoinGame";

type ModalOpen = "Create" | "Join" | undefined;

export function HomePage({ showButtons }: { showButtons?: boolean }) {
  const [modalOpen, setModalOpen] = useState<ModalOpen>();
  showButtons = false;
  return (
    <Container>
      <BackgroundImg style={{ zIndex: -1 }} />
      {modalOpen == "Create" && (
        <Modal onClick={() => setModalOpen(undefined)}>
          <CreateGame />
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
        {showButtons && (
          <div style={{ display: "flex", width: "100%", gap: "6px" }}>
            <Button style={{ flex: 1, fontSize: "1.5rem" }} onClick={() => setModalOpen("Create")}>
              Create Game
            </Button>
            <Button style={{ flex: 1, fontSize: "1.5rem" }} onClick={() => setModalOpen("Join")} secondary>
              Join Game
            </Button>
          </div>
        )}
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
