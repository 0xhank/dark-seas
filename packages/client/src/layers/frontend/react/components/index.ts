import { registerActionQueue } from "./ActionQueue";
import { registerComponentBrowser } from "./ComponentBrowser";
import { registerEnemyShip } from "./EnemyShip";
import { registerJoinGame } from "./JoinGame";
import { registerLeaderboard } from "./Leaderboard";
import { registerLoadingState } from "./LoadingState";
import { registerTopBar } from "./TopBar/TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerTopBar();
  registerEnemyShip();
  registerYourShips();
  registerTurnTimer();
  registerJoinGame();
  registerLeaderboard();
}
