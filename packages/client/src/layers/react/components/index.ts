import { registerActionQueue } from "./ActionQueue";
import { registerJoinGame } from "./JoinGame";
import { registerLoadingState } from "./LoadingState";
import { registerOptionSelect } from "./OptionSelect";
import { registerEnemyShip } from "./OverviewComponents/EnemyShip";
import { registerTopBar } from "./TopBar/TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips/YourShips";

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
