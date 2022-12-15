import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerOptionSelect } from "./OptionSelect";
import { registerEnemyShip } from "./OverviewComponents/EnemyShip";
import { registerTopBar } from "./TopBar/TopBar";
import { registerYourShips } from "./YourShips/YourShips";
import { registerTurnTimer } from "./TurnTimer";
import { registerJoinGame } from "./JoinGame";

export function registerUIComponents() {
  registerLoadingState();
  // registerComponentBrowser();
  registerActionQueue();
  registerOptionSelect();
  registerTopBar();
  registerEnemyShip();
  registerYourShips();
  registerTurnTimer();
  registerJoinGame();
}
