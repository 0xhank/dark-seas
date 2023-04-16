import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { BigNumber } from "ethers";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { GameConfigStruct } from "../../../contracts/types/ethers-contracts/CreateGameSystem";

export function createGame(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  config: GameConfigStruct,
  override?: boolean
) {
  const actionId = `create-game-${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: {},
    requirement: () => {
      if (!override) {
        if (
          config.actionPhaseLength < BigNumber.from(0) ||
          config.commitPhaseLength < BigNumber.from(0) ||
          config.revealPhaseLength < BigNumber.from(0) ||
          config.budget < BigNumber.from(0) ||
          config.buyin < BigNumber.from(0) ||
          config.entryCutoffTurns < BigNumber.from(0) ||
          config.islandThreshold < BigNumber.from(0) ||
          config.islandThreshold > BigNumber.from(100) ||
          config.shrinkRate < BigNumber.from(0) ||
          config.worldSize < BigNumber.from(0)
        ) {
          console.log("cancelling");
          actions.cancel(actionId);
          return null;
        }
      }
      return config;
    },
    updates: () => [],
    execute: (gameConfig) => {
      console.log("submitting gameConfig:", gameConfig);
      return systems["ds.system.CreateGame"].executeTyped(gameConfig);
    },
  });
}
