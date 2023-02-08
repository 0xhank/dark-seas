import React from "react";
import styled from "styled-components";
import { colors } from "../../styles/global";

export const BootScreen: React.FC<{ initialOpacity?: number; progression: number }> = ({ progression }) => {
  return (
    <Container>
      <div>
        <Img src="/img/ds-ship.png" progression={progression}></Img>
        <div style={{ fontSize: "2rem" }}>Dark Seas</div>
      </div>
    </Container>
  );
};

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  background: ${colors.blueGradient};

  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  grid-gap: 16px;
  z-index: 500;
x
  pointer-events: all;
  color: white;
`;

const Img = styled.img<{ progression: number }>`
  transform: ${({ progression }) => `translateX(calc(2 * (${progression}px - 50px)))`} rotate(270deg);
`;
