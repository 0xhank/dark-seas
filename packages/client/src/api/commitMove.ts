import { TxQueue } from "@latticexyz/network";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { components } from "../components";
import { Move, TxType } from "../game/types";
import { world } from "../world";

export function commitMove(
  gameIndex: EntityIndex,
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  moves: Move[],
  override?: boolean
) {
  const { OwnedBy, GameConfig, MoveCard } = components;
  // Entity must be owned by the player
  const actionId = `commitMove ${Date.now()}` as EntityID;
  override;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: { OwnedBy, GameConfig, MoveCard },
    requirement: () => {
      const gameId = world.entities[gameIndex];
      const encoding = abi.encode(
        ["uint256", "tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
        [gameId, moves, 0]
      );
      return { encoding, gameId };
    },
    updates: () => [],
    execute: ({ gameId, encoding }) => {
      return systems["ds.system.Commit"].executeTyped(gameId, keccak256(encoding));
    },
    metadata: {
      type: TxType.Commit,
      metadata: {
        moves,
        encoding: abi.encode(
          ["uint256", "tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
          [world.entities[gameIndex], moves, 0]
        ),
      },
    },
  });
}
