import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerSpawnShipButton } from "./SpawnShipButton";
import { registerMoveSelection } from "./MoveSelection";

export function registerUIComponents() {
  registerLoadingState();
  registerComponentBrowser();
  registerActionQueue();
  registerSpawnShipButton();
  registerMoveSelection();
}
