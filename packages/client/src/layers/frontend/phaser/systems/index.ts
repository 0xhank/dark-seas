import { PhaserLayer } from "../types";
import { createActionSelectionSystem } from "./createActionSelectionSystem";
import { createFireCannonAnimationSystem } from "./createFireCannonAnimationSystem";
import { createInputSystem } from "./createInputSystem";
import { createMoveOptionsSystem } from "./createMoveOptionsSystem";
import { createPositionSystem } from "./createPositionSystem";
import { createProjectionSystem } from "./createProjectionSystem";
import { createRadiusSystem } from "./createRadiusSystem";
import { createResetSystem } from "./createResetSystem";
import { createShipCircleSystem } from "./createShipCircleSystem";
import { createStatAnimationSystem } from "./createStatAnimationSystem";
import { createTargetedSystem } from "./createTargetedSystem";
import { createTileSystem } from "./createTileSystem";

export function createPhaserSystems(context: PhaserLayer) {
  createActionSelectionSystem(context);
  createInputSystem(context);
  createPositionSystem(context);
  createProjectionSystem(context);
  createResetSystem(context);
  createRadiusSystem(context);
  createShipCircleSystem(context);
  createMoveOptionsSystem(context);
  createStatAnimationSystem(context);
  createTargetedSystem(context);
  createFireCannonAnimationSystem(context);
  createTileSystem(context);
}
