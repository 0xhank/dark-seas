import { registerDamageChance } from "./DamageChance";
import { registerEnemyShip } from "./EnemyShip";
import { registerJoinGame } from "./JoinGame";
import { registerLoadingState } from "./LoadingState";
import { registerModal } from "./Modal/Modal";
import { registerSettings } from "./Settings";
import { registerTopBar } from "./TopBar/TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips";

export function registerUIComponents() {
  registerModal();
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
