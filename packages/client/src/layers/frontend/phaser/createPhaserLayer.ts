import { createPhaserEngine } from "@latticexyz/phaserx";
import { namespaceWorld } from "@latticexyz/recs";
import { BackendLayer } from "../../backend";
import { phaserConfig } from "./config";
import { POS_HEIGHT, POS_WIDTH } from "./constants";
import { createPhaserSystems } from "./systems";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(backend: BackendLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(backend.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {};

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const polygonRegistry = new Map<string, Phaser.GameObjects.Group>();

  // --- API ------------------------------------------------------------------------
  function createMapInteractionApi() {
    let enabled = true;

    return {
      disableMapInteraction: () => (enabled = false),
      enableMapInteraction: () => (enabled = true),
      mapInteractionEnabled: () => {
        return enabled;
      },
    };
  }
  // --- UTILS ----------------------------------------------------------------------

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    parentLayers: {
      ...backend.parentLayers,
      backend,
    },
    api: {
      mapInteraction: createMapInteractionApi(),
    },
    game,
    scenes: { ...scenes, Main: { ...scenes.Main, positions: { posWidth: POS_WIDTH, posHeight: POS_HEIGHT } } },
    polygonRegistry,
    positions: { posWidth: POS_WIDTH, posHeight: POS_HEIGHT },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createPhaserSystems(context);

  return context;
}
