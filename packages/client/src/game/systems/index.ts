import { gameLayer } from "../phaser";
import { bootSyncSystems } from "./bootSyncSystems";
import { borderSystems } from "./borderSystems";
import { createCamera } from "./camera";
import { crateSystems } from "./crateSystems";
import { createSuccessfulActionSystem } from "./createSuccessfulActionSystem";
import { createSuccessfulMoveSystem } from "./createSuccessfulMoveSystem";
import { createUISoundSystem } from "./createUISoundSystem";
import { damageBubbleSystems } from "./damageBubbleSystems";
import { firingAreaSystems } from "./firingAreaSystems";
import { inputSystems } from "./inputSystems";
import { localHealthSystems } from "./localHealthSystems";
import { moveOptionsSystems } from "./moveOptionsSystems";
import { raiseLowerSailSystems } from "./raiseLowerSailSystems";
import { shipCircleSystems } from "./shipCircleSystems";
import { shipTextureSystems } from "./shipTextureSystems";
import { stagedMoveSystems } from "./stagedMoveSystems";
import { statAnimationSystems } from "./statAnimationSystems";
import { targetedShipSystems } from "./targetedShipSystems";
import { tilemapSystems } from "./tilemapSystems";
import { turnResetSystems } from "./turnResetSystems";
export function createSystems(context: gameLayer) {
  bootSyncSystems(context);
  createSuccessfulActionSystem(context);
  createSuccessfulMoveSystem(context);
  createUISoundSystem(context);
  borderSystems(context);
  firingAreaSystems(context);
  inputSystems(context);
  localHealthSystems(context);
  moveOptionsSystems(context);
  shipCircleSystems(context);
  shipTextureSystems(context);
  stagedMoveSystems(context);
  statAnimationSystems(context);
  targetedShipSystems(context);
  tilemapSystems(context);
  turnResetSystems(context);
  createCamera(context);
  raiseLowerSailSystems(context);
  damageBubbleSystems(context);
  crateSystems(context);
}