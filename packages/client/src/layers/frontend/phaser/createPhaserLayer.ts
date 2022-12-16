import { createPhaserEngine } from "@latticexyz/phaserx";
import { defineComponent, namespaceWorld, Type } from "@latticexyz/recs";
import { BackendLayer } from "../../backend";
import { phaserConfig } from "./config";
import { POS_HEIGHT, POS_WIDTH } from "./constants";
import {
  createActiveSystem,
  createHealthSystem,
  createInputSystem,
  createPositionSystem,
  createStatUpdateSystem,
} from "./systems";
import { createProjectionSystem } from "./systems/createProjectionSystem";
import { createRadiusSystem } from "./systems/createRadiusSystem";
import { createResetSystem } from "./systems/createResetSystem";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(backend: BackendLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(backend.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    UpdateQueue: defineComponent(world, { value: Type.StringArray }, { id: "UpdateQueue" }),
  };

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const polygonRegistry = new Map<string, Phaser.GameObjects.Group>();

  // --- UTILS ----------------------------------------------------------------------

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    backend,
    game,
    scenes,
    polygonRegistry,
    positions: { posWidth: POS_WIDTH, posHeight: POS_HEIGHT },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(context);
  createPositionSystem(backend, context);
  createActiveSystem(backend, context);
  createHealthSystem(backend, context);
  createProjectionSystem(backend, context);
  createRadiusSystem(backend, context);
  createStatUpdateSystem(backend, context);
  createResetSystem(backend, context);

  return context;
}
