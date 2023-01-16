import { PhaserLayer } from "../types";
import { createActionSelectionSystem } from "./createActionSelectionSystem";
import { createBorderSystem } from "./createBorderSystem";
import { createCannonAnimationSystem } from "./createCannonAnimationSystem";
import { createInputSystem } from "./createInputSystem";
import { createMoveOptionsSystem } from "./createMoveOptionsSystem";
import { createProjectionSystem } from "./createProjectionSystem";
import { createResetSystem } from "./createResetSystem";
import { createShipCircleSystem } from "./createShipCircleSystem";
import { createShipSystem } from "./createShipSystem";
import { createStatAnimationSystem } from "./createStatAnimationSystem";
import { createTargetedSystem } from "./createTargetedSystem";
import { createTileSystem } from "./createTileSystem";

export function createPhaserSystems(context: PhaserLayer) {
  createActionSelectionSystem(context);
  createInputSystem(context);
  createShipSystem(context);
  createProjectionSystem(context);
  createResetSystem(context);
  createBorderSystem(context);
  createShipCircleSystem(context);
  createMoveOptionsSystem(context);
  createStatAnimationSystem(context);
  createTargetedSystem(context);
  createCannonAnimationSystem(context);
  createTileSystem(context);
}
