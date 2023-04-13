import { createPhaserEngine } from "@latticexyz/phaserx";
import { EntityIndex, getComponentValueStrict, namespaceWorld } from "@latticexyz/recs";
import { gameComponents } from "../../components/components";
import { NetworkLayer } from "../../mud";
import { disposeRegistries, world } from "../../world";
import { createSystems } from "../systems";
import { createGameUtilities } from "../utils/gameUtils";
import { phaserConfig } from "./config";

export async function createGameLayer(network: NetworkLayer) {
  const phaserWorld = namespaceWorld(world, "phaser");
  const { game, scenes, dispose } = await createPhaserEngine(phaserConfig);
  phaserWorld.registerDisposer(dispose);
  phaserWorld.registerDisposer(disposeRegistries);

  const gameEntity = getComponentValueStrict(network.components.Page, network.singletonEntity)
    .gameEntity as EntityIndex;

  const gameID = world.entities[gameEntity];
  if (!gameID) throw new Error("Game entity not found");

  const utils = await createGameUtilities(gameEntity, network.utils, network.network.clock, scenes.Main.phaserScene);
  const context = {
    ...network,
    world: phaserWorld,
    components: { ...gameComponents, ...network.components },
    game,
    gameEntity,
    gameID,
    scene: scenes.Main,
    utils: { ...utils, ...network.utils },
  };
  createSystems(context);

  return context;
}
