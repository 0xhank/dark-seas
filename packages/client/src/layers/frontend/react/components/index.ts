import { registerActionQueue } from "./ActionQueue";
import { registerComponentBrowser } from "./ComponentBrowser";
import { registerJoinGame } from "./JoinGame";
import { registerLoadingState } from "./LoadingState";
import { registerEnemyShip } from "./OverviewComponents/EnemyShip";
import { registerTopBar } from "./TopBar/TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips/YourShips";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerTopBar();
  registerEnemyShip();
  registerYourShips();
  registerTurnTimer();
  registerJoinGame();
}
