import {
  defineComponentSystem,
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { Phase } from "../../types";
import { getFinalPosition } from "../../utils/directions";
import { getSternPosition } from "../../utils/trig";

export function stagedMoveSystems(MUD: SetupResult) {
  const {
    world,
    components: {
      Position,
      Length,
      Rotation,
      MoveCard,
      SelectedShip,
      OwnedBy,
      Speed,
      Loaded,
      SelectedMove,
      HoveredMove,
      SailPositionLocal,
      DamagedCannonsLocal,
    },
    utils: {
      destroySpriteObject,
      getGroupObject,
      destroyGroupObject,
      getPhase,
      outOfBounds,
      renderShip,
      renderShipFiringAreas,
    },
    network: { clock },
    godEntity,
  } = MUD;

  /* --------------------------------------------- Selected Move update --------------------------------------------- */
  defineExitSystem(world, [Has(SelectedMove)], ({ entity: shipEntity }) => {
    const groupId = `projection-${shipEntity}`;
    destroyGroupObject(groupId);
    destroySpriteObject(groupId);
  });

  defineSystem(world, [Has(SelectedMove)], ({ entity: shipEntity, type, value: [newMoveEntity, oldMoveentity] }) => {
    const time = clock.currentTime;
    const phase: Phase | undefined = getPhase(time);

    if (phase == undefined || phase == Phase.Action) return;

    const groupId = `projection-${shipEntity}`;

    if (type == UpdateType.Exit) {
      destroySpriteObject(groupId);
      return;
    }

    const moveCardEntity = getComponentValue(SelectedMove, shipEntity);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPositionLocal, shipEntity).value;
    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);

    const ship = renderShip(shipEntity, groupId, finalPosition, finalRotation, colors.darkGrayHex, 0.7);
    ship?.setInteractive();
    ship?.on("pointerdown", () => {
      setComponent(SelectedShip, godEntity, { value: shipEntity });
    });
  });

  /* ---------------------------------------------- Hovered Move update --------------------------------------------- */

  defineComponentSystem(world, HoveredMove, (update) => {
    const currentTime = clock.currentTime;
    const hoveredMove = update.value[0];

    if (!hoveredMove) return;

    const shipEntity = hoveredMove.shipEntity as EntityIndex;
    const moveCardEntity = hoveredMove.moveCardEntity as EntityIndex;

    const objectId = `hoverGhost-${shipEntity}`;
    const hoverGroup = getGroupObject(objectId, true);
    if (!moveCardEntity) return;

    const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPositionLocal, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;

    const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);

    renderShipFiringAreas(shipEntity, "activeShip", finalPosition, finalRotation);

    const color =
      outOfBounds(currentTime, finalPosition) ||
      outOfBounds(currentTime, getSternPosition(finalPosition, finalRotation, length))
        ? colors.redHex
        : colors.whiteHex;

    renderShip(shipEntity, objectId, finalPosition, finalRotation, color, 0.6);
  });

  defineExitSystem(world, [Has(HoveredMove)], (update) => {
    const hoveredMove = update.value[1] as { shipEntity: EntityIndex; moveCardEntity: EntityIndex } | undefined;
    if (!hoveredMove) return;
    const objectId = `hoverGhost-${hoveredMove.shipEntity}`;

    destroySpriteObject(objectId);
    destroyGroupObject(objectId);
  });
}
