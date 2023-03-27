import { TxQueue } from "@latticexyz/network";
import { EntityID } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { SystemTypes } from "../../../contracts/types/SystemTypes";
import { components } from "../mud/components";
import { TxType } from "../types";

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
      if (!override) {
        // const commitment = getComponentValue(Commitment, playerEntity)?.value;
        // if (!commitment) {
        //   console.warn(prefix, "no commitment submitted");
        //   actions.cancel(actionId);
        //   return null;
        // }
        // const hash = keccak256(encodedCommitment);
        // if (commitment != hash) {
        //   console.warn(prefix, "commitment does not match stored committed moves");
        //   actions.cancel(actionId);
        //   return null;
        // }
      }

      const [moves, salt] = abi.decode(
        ["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
        encodedCommitment
      );
      return { moves, salt };
    },
    updates: () => [],
    execute: ({ moves, salt }) => {
      return systems["ds.system.Move"].executeTyped(moves, salt, {
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
