import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { components } from "../mud/components";
import { Move, TxType } from "../types";

export function commitMove(systems: TxQueue<SystemTypes>, actions: ActionSystem, moves: Move[], override?: boolean) {
  const { OwnedBy, GameConfig, MoveCard } = components;
  // Entity must be owned by the player
  const actionId = `commitMove ${Date.now()}` as EntityID;
  override;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: { OwnedBy, GameConfig, MoveCard },
    requirement: () => {
      return abi.encode(["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"], [moves, 0]);
    },
    updates: () => [],
    execute: (encoding: string) => {
      return systems["ds.system.Commit"].executeTyped(keccak256(encoding));
    },
    metadata: {
      type: TxType.Commit,
      metadata: {
        moves,
        encoding: abi.encode(["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"], [moves, 0]),
      },
    },
  });
}
