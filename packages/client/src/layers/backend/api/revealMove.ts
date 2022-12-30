import { EntityID, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { NetworkLayer } from "../../network";

export function revealMove(network: NetworkLayer, actions: ActionSystem, committedMoves: string) {
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
        return null;
      }

      const commitment = getComponentValue(Commitment, playerEntity)?.value;

      if (!commitment) {
        console.warn(prefix, "no commitment submitted");
        return null;
      }

      const hash = keccak256(committedMoves);
      if (commitment != hash) {
        console.warn(prefix, "commitment does not match stored committed moves");
        return null;
      }

      const [moves, salt] = abi.decode(
        ["tuple(uint256 shipEntity, uint256 moveCardEntity)[]", "uint256"],
        committedMoves
      );
      return { moves, salt };
    },
    updates: () => [],
    execute: ({ moves, salt }) => {
      network.api.revealMove(moves, salt);
    },
  });
}
