import { Link } from "react-router-dom";
import styled from "styled-components";
import { BackgroundImg, colors } from "../styles/global";

export function HomePage() {
  return (
    <Container>
      <BackgroundImg style={{ zIndex: -1 }} />
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
          <EnterButton to="/app">Enter</EnterButton>
        </div>
      </div>
    </Container>
  );
}

const EnterButton = styled(Link)`
  width: 100%;
  font-size: 1.5rem;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: gold;
  border: 1px solid ${colors.gold};
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  pointer-events: all;
  color: ${colors.darkBrown};
  :hover {
    background: ${colors.lightGold};
  }

  :disabled {
    opacity: 40%;
    cursor: not-allowed;
  }
`;
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
