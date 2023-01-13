import { BackendLayer } from "..";
import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createUISoundSystem } from "./createUISoundSystem";

export function createBackendSystems(backend: BackendLayer) {
  createSuccessfulActionSystem(backend);
  createUISoundSystem(backend);
}
