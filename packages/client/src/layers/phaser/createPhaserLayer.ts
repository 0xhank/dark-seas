import { createPhaserEngine } from "@latticexyz/phaserx";
import { defineComponent, namespaceWorld, Type } from "@latticexyz/recs";
import { defineNumberComponent, defineStringComponent } from "@latticexyz/std-client";
import { Phase } from "../../types";
import { NetworkLayer } from "../network";
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
export async function createPhaserLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedMove: defineNumberComponent(world, { id: "SelectedMove" }),
    SelectedShip: defineNumberComponent(world, { id: "SelectedShip" }),
    Selection: defineNumberComponent(world, { id: "Selection" }),
    SelectedActions: defineComponent(world, { value: Type.NumberArray }, { id: "Actions" }),
    CommittedMoves: defineStringComponent(world, { id: "Committed Moves" }),
    UpdateQueue: defineComponent(world, { value: Type.StringArray }, { id: "UpdateQueue" }),
  };

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const polygonRegistry = new Map<string, Phaser.GameObjects.Group>();

  // --- UTILS ----------------------------------------------------------------------

  function secondsUntilNextPhase(time: number) {
    const {
      utils: { getGameConfig, getPhase },
    } = network;

    const gameConfig = getGameConfig();
    const phase = getPhase();

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor(time / 1000) - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    const secondsIntoTurn = gameLength % turnLength;

    const phaseEnd =
      phase == Phase.Commit
        ? gameConfig.commitPhaseLength
        : phase == Phase.Reveal
        ? gameConfig.commitPhaseLength + gameConfig.revealPhaseLength
        : turnLength;

    return phaseEnd - secondsIntoTurn;
  }

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    network,
    game,
    scenes,
    polygonRegistry,
    positions: { posWidth: POS_WIDTH, posHeight: POS_HEIGHT },
    utils: { secondsUntilNextPhase },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createPositionSystem(network, context);
  createActiveSystem(network, context);
  createHealthSystem(network, context);
  createProjectionSystem(network, context);
  createRadiusSystem(network, context);
  createStatUpdateSystem(network, context);
  createResetSystem(network, context);

  return context;
}
