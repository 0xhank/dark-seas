import { SetupResult } from "../../setupMUD";
import { bootSyncSystems } from "./bootSyncSystems";
import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createSuccessfulMoveSystem } from "./createSuccessfulMoveSystem";
import { createUISoundSystem } from "./createUISoundSystem";
export function createBackendSystems(MUD: SetupResult) {
  bootSyncSystems(MUD);
  createSuccessfulActionSystem(MUD);
  createSuccessfulMoveSystem(MUD);
  createUISoundSystem(MUD);
}
