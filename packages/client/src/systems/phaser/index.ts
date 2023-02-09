import { createActionSelectionSystem } from "./createActionSelectionSystem";
import { createBorderSystem } from "./createBorderSystem";
import { createCannonAnimationSystem } from "./createCannonAnimationSystem";
import { createHealthLocalSystem } from "./createHealthLocalSystem";
import { createInputSystem } from "./createInputSystem";
import { createMoveOptionsSystem } from "./createMoveOptionsSystem";
import { createProjectionSystem } from "./createProjectionSystem";
import { createResetSystem } from "./createResetSystem";
import { createShipCircleSystem } from "./createShipCircleSystem";
import { createShipSystem } from "./createShipSystem";
import { createStatAnimationSystem } from "./createStatAnimationSystem";
import { createTargetedSystem } from "./createTargetedSystem";
import { createTileSystem } from "./createTileSystem";
export function createPhaserSystems() {
  createActionSelectionSystem();
  createInputSystem();
  createShipSystem();
  createProjectionSystem();
  createResetSystem();
  createBorderSystem();
  createShipCircleSystem();
  createMoveOptionsSystem();
  createStatAnimationSystem();
  createTargetedSystem();
  createCannonAnimationSystem();
  createTileSystem();
  createHealthLocalSystem();
}
