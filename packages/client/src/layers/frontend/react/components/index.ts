import { registerComponentBrowser } from "./ComponentBrowser";
import { registerDamageChance } from "./DamageChance";
import { registerHoveredShip } from "./HoveredShip";
import { registerJoinGame } from "./JoinGame";
import { registerLoadingState } from "./LoadingState";
import { registerModal } from "./Modal/Modal";
import { registerSettings } from "./Settings";
import { registerTopBar } from "./TopBar";
import { registerTurnTimer } from "./TurnTimer";
import { registerYourShips } from "./YourShips";

export function registerUIComponents() {
  registerModal();
  registerComponentBrowser();
  // registerActionQueue();
  registerSettings();
  registerTopBar();
  registerHoveredShip();
  registerYourShips();
  registerTurnTimer();
  registerJoinGame();
  registerDamageChance();

  // ALWAYS LAST
  registerLoadingState();
}
