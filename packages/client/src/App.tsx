import { useEffect, useState } from "react";
import { MUDProvider } from "./mud/providers/MUDProvider";
import { Game } from "./react/components/Game";
import { HomePage } from "./react/Homepage/Homepage";
import { setupMUD, SetupResult } from "./setupMUD";
export const App = () => {
  const [MUD, setMUD] = useState<SetupResult>();
  const params = new URLSearchParams(window.location.search);
  const worldAddress = params.get("worldAddress");

  useEffect(() => {
    if (!worldAddress) return;
    setupMUD().then((result) => setMUD(result));
  }, [worldAddress]);

  if (MUD)
    return (
      <MUDProvider {...MUD}>
        <Game />
      </MUDProvider>
    );
  return <HomePage showButtons={!worldAddress} />;
};
