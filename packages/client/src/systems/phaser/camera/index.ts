import { SetupResult } from "../../../setupMUD";
import { createConstrainCameraSystem } from "./createConstrainCameraSystem";
import { registerCameraControls } from "./registerCameraControls";

export function createCamera(MUD: SetupResult) {
  createConstrainCameraSystem(MUD);
  registerCameraControls(MUD);
}
