import { registerDamageChance } from "./DamageChance";
import { registerEnemyShip } from "./EnemyShip";
import { registerJoinGame } from "./JoinGame";
import { registerLeaderboard } from "./Leaderboard";
import { registerLoadingState } from "./LoadingState";
import { registerSettings } from "./Settings";
import { registerTopBar } from "./TopBar/TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips";

export function registerUIComponents() {
  registerLeaderboard();
  // registerComponentBrowser();
  // registerActionQueue();
  registerSettings();
  registerTopBar();
  registerEnemyShip();
  registerYourShips();
  registerTurnTimer();
  registerJoinGame();
  registerDamageChance();

  // ALWAYS LAST
  registerLoadingState();
}
