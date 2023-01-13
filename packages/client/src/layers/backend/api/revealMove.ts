import { EntityID, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { NetworkLayer } from "../../network";

export function revealMove(network: NetworkLayer, actions: ActionSystem, encodedCommitment: string) {
  const {
    components: { Commitment },
    utils: { getPlayerEntity },
    world,
  } = network;

  // Entity must be owned by the player
  const prefix = "Reveal Move: ";
  const actionId = `revealMove ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    components: { Commitment },
    requirement: ({ Commitment }) => {
      const playerEntity = getPlayerEntity();
      if (!playerEntity) {
        console.warn(prefix, "No player entity");
        actions.cancel(actionId);
        return null;
      }

      const commitment = getComponentValue(Commitment, playerEntity)?.value;

      if (!commitment) {
        console.warn(prefix, "no commitment submitted");
        actions.cancel(actionId);

        return null;
      }

      const hash = keccak256(encodedCommitment);
      if (commitment != hash) {
        console.warn(prefix, "commitment does not match stored committed moves");
        actions.cancel(actionId);

        return null;
      }

      const [moves, salt] = abi.decode(
        ["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
        encodedCommitment
      );
      return { moves, salt };
    },
    updates: () => [],
    execute: ({ moves, salt }) => {
      network.api.revealMove(moves, salt);
    },
  });
}
