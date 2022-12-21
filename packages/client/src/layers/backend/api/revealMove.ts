import { GodID } from "@latticexyz/network";
import { EntityID, EntityIndex, getComponentValue } from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { keccak256 } from "ethers/lib/utils";
import { NetworkLayer } from "../../network";

export function revealMove(network: NetworkLayer, actions: ActionSystem, committedMoves: string) {
  const {
    components: { Commitment },
    utils: { getPlayerEntity },
    world,
  } = network;
  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

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
      return committedMoves;
    },
    updates: () => [],
    execute: (committedMoves: string) => {
      console.log("revealing move");
      network.api.revealMove(committedMoves);
    },
  });
}
