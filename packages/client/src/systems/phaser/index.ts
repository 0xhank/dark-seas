import { SetupResult } from "../../setupMUD";
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
export function createPhaserSystems(MUD: SetupResult) {
  createActionSelectionSystem(MUD);
  createInputSystem(MUD);
  createShipSystem(MUD);
  createProjectionSystem(MUD);
  createResetSystem(MUD);
  createBorderSystem(MUD);
  createShipCircleSystem(MUD);
  createMoveOptionsSystem(MUD);
  createStatAnimationSystem(MUD);
  createTargetedSystem(MUD);
  createCannonAnimationSystem(MUD);
  createTileSystem(MUD);
  createHealthLocalSystem(MUD);
}
