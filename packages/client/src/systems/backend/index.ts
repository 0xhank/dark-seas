import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createSuccessfulMoveSystem } from "./createSuccessfulMoveSystem";
import { createUISoundSystem } from "./createUISoundSystem";

export function createBackendSystems() {
  createSuccessfulActionSystem();
  createSuccessfulMoveSystem();
  createUISoundSystem();
}
