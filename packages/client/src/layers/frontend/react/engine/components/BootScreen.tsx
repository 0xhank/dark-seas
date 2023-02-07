import React from "react";
import styled from "styled-components";
import { colors } from "../../styles/global";

export const BootScreen: React.FC<{ initialOpacity?: number; progression: number }> = ({ progression }) => {
  return (
    <Container>
      <BackgroundImg />
      <div
        style={{
          height: "80%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          zIndex: 502,
        }}
      >
        <Logo src="/img/ds-logo.png" />
        <div
          style={{
            width: "100%",
            height: "50px",
            background: colors.thickGlass,
            borderRadius: "6px",
            display: "flex",
            position: "relative",
            alignItems: "center",
          }}
        >
          <Img src="/img/ds-ship.png" progression={progression}></Img>
        </div>
      </div>
    </Container>
  );
};

const BackgroundImg = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  z-index: 500;
  display: block;
  background-image: url("https://i.imgur.com/lL6tQfy.png");
  background-image: url(img/ds-background.jpg);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  width: 100vw;
  height: 100vh;
  filter: blur(5px) saturate(40%);
`;
const Logo = styled.img`
  height: 75%;
`;
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;  
  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  grid-gap: 16px;
  z-index: 501;
x
  pointer-events: all;
  color: white;
`;

const Img = styled.img<{ progression: number }>`
  position: absolute;
  transform: rotate(270deg);
  left: ${({ progression }) => `${progression}%`};
`;
