import { defineComponentSystem, defineRxSystem, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { MOVE_LENGTH } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Category } from "../../sound";
import { Move, TxType } from "../../types";

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
    utils: { playSound },
    actions: { Action },
    godEntity,
  } = MUD;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    const oldAction = value[1];
    if (newAction || !oldAction) return;
    if (!oldAction.metadata) return;

    const { type, metadata } = oldAction.metadata as { type: TxType; metadata: any };
    if (type !== TxType.Commit && oldAction.state !== ActionState.Complete) return;

    const { moves, encoding } = metadata as { moves: Move[]; encoding: string };
    setComponent(EncodedCommitment, godEntity, { value: encoding });

    moves.map((move) => {
      const shipEntity = world.entityToIndex.get(move.shipEntity);
      const moveCardEntity = world.entityToIndex.get(move.moveCardEntity);
      if (!shipEntity || !moveCardEntity) return;
      setComponent(CommittedMove, shipEntity, { value: moveCardEntity });
    });
  });

  defineRxSystem(world, systemCallStreams["ds.system.Move"], (systemCall) => {
    const { updates } = systemCall;

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
