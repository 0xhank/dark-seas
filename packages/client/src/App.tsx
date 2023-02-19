import { useEffect, useState } from "react";
import styled from "styled-components";
import { MUDProvider } from "./mud/providers/MUDProvider";
import { Game } from "./react/components/Game";
import { BackgroundImg } from "./react/styles/global";
import { setupMUD, SetupResult } from "./setupMUD";
import { createBackendSystems } from "./systems/backend";
import { createPhaserSystems } from "./systems/phaser";
export const App = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const params = new URLSearchParams(window.location.search);
  const worldAddress = params.get("worldAddress");

  useEffect(() => {
    console.log("world address:", worldAddress);
    if (!worldAddress) return;
    setupMUD().then((result) => {
      console.log("result:", result);
      createBackendSystems(result);
      createPhaserSystems(result);

      setMUD(result);
    });
  }, [worldAddress]);

  if (MUD)
    return (
      <MUDProvider {...MUD}>
        <Game />
      </MUDProvider>
    );
  return <HomePage />;
};

function HomePage() {
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
      </div>
    </Container>
  );
}

const Logo = styled.img`
  height: 75%;
`;
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;  
  display: flex;
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
