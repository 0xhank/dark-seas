import { namespaceWorld } from "@latticexyz/recs";
import { createPhaserEngine } from "@latticexyz/phaserx";
import { phaserConfig } from "./config";
import { NetworkLayer } from "../network";
import {
  createPositionSystem,
  createInputSystem,
  createArrowSystem,
  createActiveSystem,
  createHealthSystem,
} from "./systems";
import { defineNumberComponent } from "@latticexyz/std-client";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
    SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
  };

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const polygonRegistry = new Map<string, Phaser.GameObjects.Group>();

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    network,
    game,
    scenes,
    polygonRegistry,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createPositionSystem(network, context);
  createArrowSystem(network, context);
  createActiveSystem(network, context);
  createHealthSystem(network, context);

  return context;
}