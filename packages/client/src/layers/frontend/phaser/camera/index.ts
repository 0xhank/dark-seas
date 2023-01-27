import { PhaserEngineConfig, ScenesConfig } from "@latticexyz/phaserx/dist/types";
import { PhaserLayer } from "../types";
import { createConstrainCameraSystem } from "./createConstrainCameraSystem";
import { createSmoothCameraControls } from "./createSmoothCameraControls";
import { registerCameraControls } from "./registerCameraControls";

export function createCamera<S extends ScenesConfig>(layer: PhaserLayer, config: PhaserEngineConfig<S>) {
  createSmoothCameraControls(layer, config);
  createConstrainCameraSystem(layer);
  registerCameraControls(layer, config);
}
