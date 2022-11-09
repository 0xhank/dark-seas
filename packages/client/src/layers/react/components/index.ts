import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerSpawnShipButton } from "./SpawnShipButton";
import { registerMoveSelection } from "./MoveSelection";
import { registerMoveButton } from "./MoveButton";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerSpawnShipButton();
  registerMoveSelection();
  registerMoveButton();
}
