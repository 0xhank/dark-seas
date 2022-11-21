import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerSpawnShipButton } from "./SpawnShipButton";
import { registerWind } from "./Wind";
import { registerMoveButton } from "./MoveButton";
import { registerAttackButton } from "./AttackButton";
import { registerMoveSelection } from "./MoveSelection";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerSpawnShipButton();
  registerMoveSelection();
  registerAttackButton();
  registerMoveButton();
  registerWind();
}
