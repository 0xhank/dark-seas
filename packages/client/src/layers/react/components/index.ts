import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerSpawnShipButton } from "./SpawnShipButton";
import { registerMoveButton } from "./MoveButton";
import { registerAttackButton } from "./AttackButton";
import { registerMoveSelection } from "./MoveSelection";
import { registerCompass } from "./Compass";
import { registerShipOverview } from "./ShipOverview";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerShipSpawnButton();
  registerMoveSelection();
  // registerAttackButton();
  // registerMoveButton();
  registerCompass();
  registerShipOverview();
}
