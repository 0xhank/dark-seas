import { createConstrainCameraSystem } from "./createConstrainCameraSystem";
import { registerCameraControls } from "./registerCameraControls";

export function createCamera() {
  createConstrainCameraSystem();
  registerCameraControls();
}
