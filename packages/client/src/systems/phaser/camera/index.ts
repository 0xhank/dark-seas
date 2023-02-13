import { SetupResult } from "../../../setupMUD";
import { cameraConstraintSystems } from "./cameraConstraintSystems";
import { cameraControlSystems } from "./registerCameraControls";
export function createCamera(MUD: SetupResult) {
  cameraConstraintSystems(MUD);
  cameraControlSystems(MUD);
}
