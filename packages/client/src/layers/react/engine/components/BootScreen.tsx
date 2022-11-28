import React, { useEffect, useState } from "react";
import styled from "styled-components";

export const BootScreen: React.FC<{ initialOpacity?: number }> = ({ children, initialOpacity }) => {
  const [opacity, setOpacity] = useState(initialOpacity ?? 0);

  useEffect(() => setOpacity(1), []);

  return (
    <Container>
      <img src="/img/ds-ship.png" style={{ opacity, transform: "rotate(270deg)" }}></img>
      <div style={{ fontSize: "2rem" }}>Dark Seas</div>
      <div>{children || <>&nbsp;</>}</div>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: #0667a4;
  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  grid-gap: 16px;
  z-index: 100;
  pointer-events: all;
  color: white;

  img {
    transition: all 2s ease;
    width: 100px;
  }
`;
