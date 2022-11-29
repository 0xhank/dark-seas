import { registerComponentBrowser } from "./ComponentBrowser";
import { registerActionQueue } from "./ActionQueue";
import { registerLoadingState } from "./LoadingState";
import { registerShipSpawnButton } from "./ShipSpawnButton";
import { registerMoveSelection } from "./MoveSelection";
import { registerShipOverview } from "./ShipOverview";
import { registerTopBar } from "./TopBar/TopBar";
import { registerYourShips } from "./YourShips";

export function registerUIComponents() {
  registerLoadingState();
  // registerComponentBrowser();
  registerActionQueue();
  registerMoveSelection();
  registerTopBar();
  registerShipOverview();
  registerYourShips();
}
