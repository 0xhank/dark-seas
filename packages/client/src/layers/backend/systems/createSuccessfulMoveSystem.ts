import { defineComponentSystem, defineRxSystem, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { Move } from "../../../types";
import { MOVE_LENGTH } from "../../frontend/phaser/constants";
import { Category } from "../sound/library";
import { BackendLayer, TxType } from "../types";

export function createSuccessfulMoveSystem(layer: BackendLayer) {
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
  } = layer;

  defineComponentSystem(world, Action, ({ value }) => {
    const newAction = value[0];
    if (!newAction?.metadata) return;

    const { type, metadata } = newAction.metadata as { type: TxType; metadata: any };
    if (type !== TxType.Commit) return;

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
