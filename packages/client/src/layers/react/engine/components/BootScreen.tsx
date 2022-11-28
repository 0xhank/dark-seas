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
    transition: all 2s ease;
    width: 100px;
  }
`;

const pulse = keyframes`
	0% {
		transform: rotate(265deg)  translate(-10, -50px);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
	}

	25% {
		transform: rotate(270deg) translate(0, 0px);
	}

	50% {
		transform: rotate(275deg) translate(0, 50px);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}

  75% {
		transform: rotate(270deg) translate(0, 0px);
	}

	100% {
		transform: rotate(265deg) translate(0, -50px);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}
`;

const Img = styled.img<{ opacity?: number }>`
  opacity: ${({ opacity }) => `${opacity ? opacity : "100"}`};
  transform: rotate(270deg);
  animation-name: ${pulse};
  animation-duration: 2s;
  animation-iteration-count: infinite;
`;
