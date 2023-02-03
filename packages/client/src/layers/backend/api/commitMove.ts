import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { Move } from "../../../types";
import { NetworkLayer } from "../../network";
import { TxType } from "../types";

export function commitMove(network: NetworkLayer, actions: ActionSystem, moves: Move[]) {
  const {
    components: { OwnedBy, GameConfig, MoveCard },
  } = network;

  // Entity must be owned by the player
  const actionId = `commitMove ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    components: { OwnedBy, GameConfig, MoveCard },
    requirement: () => {
      return abi.encode(["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"], [moves, 0]);
    },
    updates: () => [],
    execute: (encoding: string) => {
      console.log("committing", encoding);
      network.api.commitMove(keccak256(encoding));
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
