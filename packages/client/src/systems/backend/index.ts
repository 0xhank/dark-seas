import { SetupResult } from "../../setupMUD";
import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createSuccessfulMoveSystem } from "./createSuccessfulMoveSystem";
import { createUISoundSystem } from "./createUISoundSystem";

export function createBackendSystems(MUD: SetupResult) {
  createSuccessfulActionSystem(MUD);
  createSuccessfulMoveSystem(MUD);
  createUISoundSystem(MUD);
}
