import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

export const BootScreen: React.FC<{ initialOpacity?: number }> = ({ children, initialOpacity }) => {
  const [opacity, setOpacity] = useState(initialOpacity ?? 0);

  useEffect(() => setOpacity(1), []);

  return (
    <Container>
      <Img src="/img/ds-ship.png" style={{ opacity, transform: "rotate(270deg)" }}></Img>
      <div style={{ fontSize: "2rem" }}>Dark Seas</div>
      <div>{children || <>&nbsp;</>}</div>
    </Container>
  );
};

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #0667a4;
  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  grid-gap: 16px;
  z-index: 500;
  pointer-events: all;
  color: white;

  img {
    transition: all 5s ease;
    width: 100px;
  }
`;

const pulse = keyframes`
	0% {
		transform: rotate(250deg)  translate(0, -200px);
	}

	25% {
		transform: rotate(270deg) translate(10px, -100px);
	}

	50% {
		transform: rotate(290deg) translate(0, 0px);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}

  75% {
		transform: rotate(270deg) translate(-10px, 100px);
	}

  100% {
		transform: rotate(250deg) translate(0px, 200px);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}


`;

const Img = styled.img<{ opacity?: number }>`
  opacity: ${({ opacity }) => `${opacity ? opacity : "100"}`};
  transform: rotate(270deg);
  animation-name: ${pulse};
  animation-duration: 4s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
`;
