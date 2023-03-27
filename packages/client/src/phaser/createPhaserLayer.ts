import { createPhaserEngine } from "@latticexyz/phaserx";
import { namespaceWorld } from "@latticexyz/recs";
import { NetworkLayer } from "../mud";
import { clientComponents } from "../mud/components";
import { createUtilities } from "../mud/utilities";
import { disposeRegistries, world } from "../mud/world";
import { createSystems } from "../systems";
import { phaserConfig } from "./config";
export async function createPhaserLayer(network: NetworkLayer) {
  const phaserWorld = namespaceWorld(world, "phaser");
  const { game, scenes, dispose } = await createPhaserEngine(phaserConfig);
  phaserWorld.registerDisposer(dispose);
  phaserWorld.registerDisposer(disposeRegistries);
  const utils = await createUtilities(
    network.godEntity,
    network.playerAddress,
    network.network.clock,
    scenes.Main.phaserScene
  );
  const context = {
    ...network,
    world: phaserWorld,
    components: { ...clientComponents, ...network.components },
    game,
    scene: scenes.Main,
    utils,
  };
  createSystems(context);

  return context;
}
