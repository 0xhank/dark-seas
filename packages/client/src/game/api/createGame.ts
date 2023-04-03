import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { GameConfigStruct } from "../../../../contracts/types/ethers-contracts/InitSystem";
import { SystemTypes } from "../../../../contracts/types/SystemTypes";

export function createGame(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  config: GameConfigStruct,
  override?: boolean
) {
  const actionId = `create game${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      if (!override) {
        if (
          config.actionPhaseLength < 0 ||
          config.commitPhaseLength < 0 ||
          config.revealPhaseLength < 0 ||
          config.budget < 0 ||
          config.buyin < 0 ||
          config.entryCutoffTurns < 0 ||
          config.islandThreshold < 0 ||
          config.islandThreshold > 100 ||
          config.shrinkRate < 0 ||
          config.worldSize < 0
        ) {
          actions.cancel(actionId);
          return null;
        }
      }
      return config;
    },
    updates: () => [],
    execute: (gameConfig) => {
      console.log("submitting actions:", actions);
      return systems["ds.system.CreateGame"].executeTyped(gameConfig, {
        gasLimit: 10_000_000,
      });
    },
  });
}
