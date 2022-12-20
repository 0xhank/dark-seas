import { GodID } from "@latticexyz/network";
import {
  Component,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  setComponent,
  Type,
} from "@latticexyz/recs";
import { ActionSystem } from "@latticexyz/std-client";
import { defaultAbiCoder as abi, keccak256 } from "ethers/lib/utils";
import { getFinalPosition } from "../../../utils/directions";
import { inRange } from "../../../utils/distance";
import { NetworkLayer } from "../../network";

export function commitMove(
  network: NetworkLayer,
  actions: ActionSystem,
  CommittedMoves: Component<{ value: Type.String }>,
  ships: EntityIndex[],
  moves: EntityIndex[]
) {
  const {
    components: { OwnedBy, GameConfig, Wind, MoveCard, Position, Rotation, SailPosition },
    network: { connectedAddress },
    utils: { getPlayerEntity },
    world,
  } = network;
  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  // Entity must be owned by the player
  const prefix = "Commit Move:";
  const actionId = `commitMove ${Date.now()}` as EntityID;
  actions.add({
    id: actionId,
    components: { OwnedBy, GameConfig, Wind, MoveCard, CommittedMoves },
    requirement: ({ OwnedBy, Wind, MoveCard }) => {
      if (ships.length !== moves.length) {
        console.warn(prefix, "ship and movecard mismatch");
        actions.cancel(actionId);
        return null;
      }

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const worldRadius = getComponentValueStrict(GameConfig, GodEntityIndex).worldRadius;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (playerEntity == null) return null;

      for (let i = 0; i < ships.length; i++) {
        const shipEntity = ships[i];
        const moveEntity = moves[i];
        if (moveEntity == undefined) continue;
        const movingEntityOwner = getComponentValue(OwnedBy, shipEntity)?.value;
        if (movingEntityOwner == null) {
          console.warn(prefix, "Entity has no owner");
          actions.cancel(actionId);
          return null;
        }

        if (movingEntityOwner !== connectedAddress.get()) {
          console.warn(prefix, "Can only move entities you own", movingEntityOwner, connectedAddress.get());
          actions.cancel(actionId);
          return null;
        }
        const moveCard = getComponentValueStrict(MoveCard, moveEntity);
        const position = getComponentValueStrict(Position, shipEntity);
        const rotation = getComponentValueStrict(Rotation, shipEntity).value;
        const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;

        if (
          !inRange(
            getFinalPosition(moveCard, position, rotation, sailPosition, wind).finalPosition,
            { x: 0, y: 0 },
            worldRadius
          )
        ) {
          console.warn(prefix, "move out of bounds");
          actions.cancel(actionId);
          return null;
        }
      }

      const shipWorldEntities = ships.map((s) => world.entities[s]);
      const moveWorldEntities = moves.map((m) => world.entities[m]);

      return abi.encode(["uint256[]", "uint256[]", "uint256"], [shipWorldEntities, moveWorldEntities, 0]);
    },
    updates: () => [],
    execute: (encoding: string) => {
      console.log("committing", encoding);
      network.api.commitMove(keccak256(encoding));
      setComponent(CommittedMoves, GodEntityIndex, { value: encoding });
    },
  });
}
