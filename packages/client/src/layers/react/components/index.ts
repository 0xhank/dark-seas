import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerSpawnShipButton } from "./SpawnShipButton";
import { registerMoveButton } from "./MoveButton";
import { registerAttackButton } from "./AttackButton";
import { registerMoveSelection } from "./MoveSelection";
import { registerCompass } from "./Compass";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerSpawnShipButton();
  registerMoveSelection();
  registerAttackButton();
  registerMoveButton();
  registerCompass();
}
