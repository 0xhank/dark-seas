import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { components } from "../components";
import { TxType } from "../game/types";

export function revealMove(
  systems: TxQueue<SystemTypes>,
  actions: ActionSystem,
  encodedCommitment: string,
  override?: boolean
) {
  const { Commitment } = components;
  // Entity must be owned by the player
  const actionId = `revealMove ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    awaitConfirmation: true,
    components: { Commitment },
    requirement: ({ Commitment }) => {
      const [gameId, moves, salt] = abi.decode(
        ["uint256", "tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
        encodedCommitment
      );
      return { gameId, moves, salt };
    },
    updates: () => [],
    execute: ({ gameId, moves, salt }) => {
      return systems["ds.system.Move"].executeTyped(gameId, moves, salt, {
        gasLimit: 5_000_000,
        type: 2,
        gasPrice: undefined,
      });
    },
    metadata: {
      type: TxType.Reveal,
      metadata: { encodedCommitment },
    },
  });
}
