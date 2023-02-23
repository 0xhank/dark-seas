import { deferred } from "@latticexyz/utils";

export const createPhaserGame = async (config: Phaser.Types.Core.GameConfig) => {
  const game = new Phaser.Game(config);
  const [resolve, , promise] = deferred();
  game.events.on("ready", resolve);
  await promise;
  return game;
};
