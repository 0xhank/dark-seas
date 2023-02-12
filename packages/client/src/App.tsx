import { useEffect, useState } from "react";
import { MUDProvider } from "./MUDContext";
import { Game } from "./react/components/Game";
import { BackgroundImg } from "./react/styles/global";
import { setupMUD, SetupResult } from "./setupMUD";
import { createBackendSystems } from "./systems/backend";
import { createPhaserSystems } from "./systems/phaser";
export const App = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  useEffect(() => {
    setupMUD().then((result) => {
      createBackendSystems(result);
      createPhaserSystems(result);

      setMUD(result);
    });
  }, []);

  if (MUD)
    return (
      <MUDProvider {...MUD}>
        <Game />
      </MUDProvider>
    );
  return <BackgroundImg />;
};
