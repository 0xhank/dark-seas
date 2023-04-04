import {
  defineComponentSystem,
  defineRxSystem,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { MOVE_LENGTH } from "../phaser/constants";
import { Category } from "../sound";
import { Move, SetupResult, TxType } from "../types";

export function createSuccessfulMoveSystem(MUD: SetupResult) {
  const {
    world,
    systemCallStreams,
    components: {
      EncodedCommitment,
      CommittedMove,
      Health,
      SailPosition,
      HealthLocal,
      HealthBackend,
      SailPositionLocal,
    },

    utils: { playSound, clearComponent },
    actions: { Action },
    gameEntity,
    gameId,
  } = MUD;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction || !newAction.metadata) return;
    const { type, metadata } = newAction.metadata as { type: TxType; metadata: any };
    if (type !== TxType.Commit) return;
    const { moves, encoding } = metadata as { gameId: string; moves: Move[]; encoding: string };
    if (newAction.state == ActionState.WaitingForTxEvents || newAction.state == ActionState.Complete) {
      setComponent(EncodedCommitment, gameEntity, { value: encoding });

      moves?.map((move) => {
        const shipEntity = world.entityToIndex.get(move.shipEntity);
        const moveCardEntity = world.entityToIndex.get(move.moveCardEntity);
        if (!shipEntity || !moveCardEntity) return;
        setComponent(CommittedMove, shipEntity, { value: moveCardEntity });
      });
    }
    if (newAction.state == ActionState.Failed) {
      removeComponent(EncodedCommitment, gameEntity);
      clearComponent(CommittedMove);
    }
  });

  defineRxSystem(world, systemCallStreams["ds.system.Move"], (systemCall) => {
    const { updates, args } = systemCall;

    const { gameId: systemGameId, moves } = args as { gameId: string; moves: Move[] };
    console.log("game id: ", gameId);
    console.log("system game id: ", systemGameId);
    if (gameId !== systemGameId) return;
    updates.forEach(async ({ entity: shipEntity, component, value: newComponent }) => {
      await new Promise((resolve) => setTimeout(resolve, MOVE_LENGTH));
      if (newComponent == undefined) return;
      if (component == Health) {
        const value = newComponent.value as number;

        if (value < getComponentValueStrict(HealthLocal, shipEntity).value) {
          setComponent(HealthLocal, shipEntity, { value });
          setComponent(HealthBackend, shipEntity, { value });
          playSound("impact_ship_1", Category.Combat);
        }
      } else if (component == SailPosition) {
        const value = newComponent.value as number;
        setComponent(SailPositionLocal, shipEntity, { value });
      }
    });
  });
}
