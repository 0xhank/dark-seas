import { BackendLayer } from "..";
import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createSuccessfulMoveSystem } from "./createSuccessfulMoveSystem";
import { createUISoundSystem } from "./createUISoundSystem";

export function createBackendSystems(backend: BackendLayer) {
  createSuccessfulActionSystem(backend);
  createSuccessfulMoveSystem(backend);
  // createSuccessfulRespawnSystem(backend);
  createUISoundSystem(backend);
}
