import { Game } from "./layers/frontend/react/components/Game";
import { createBackendSystems } from "./systems/backend";
import { createPhaserSystems } from "./systems/phaser";

export const App = () => {
  createBackendSystems();
  createPhaserSystems();
  return <Game />;
};
