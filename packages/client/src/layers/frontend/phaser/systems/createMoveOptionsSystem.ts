import {
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  Has,
  UpdateType,
} from "@latticexyz/recs";
import { Phase } from "../../../../types";
import { getFinalPosition } from "../../../../utils/directions";
import { getColorNum } from "../../../../utils/procgen";
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderShip } from "./renderShip";

export function createMoveOptionsSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Rotation, SailPosition, MoveCard, Speed },
        utils: { getPhase },
      },
      backend: {
        components: { HoveredShip },
        utils: { isMyShip },
        godIndex,
      },
    },
    scenes: {
      Main: { objectPool },
    },
  } = phaser;
  /* ---------------------------------------------- Move Options update ------------------------------------------- */
  defineSystem(world, [Has(HoveredShip)], (update) => {
    if (update.type == UpdateType.Exit) return;

    if (getPhase(DELAY) !== Phase.Commit) return;
    const shipEntity = getComponentValueStrict(HoveredShip, godIndex).value as EntityIndex;

    const moveCardEntities = [...getComponentEntities(MoveCard)];
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    moveCardEntities.map((moveCardEntity) => {
      const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);

      const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);
      const shipColor = isMyShip(shipEntity) ? getColorNum(shipEntity) : colors.whiteHex;

      const objectId = `optionGhost-${moveCardEntity}`;
      renderShip(phaser, shipEntity, objectId, finalPosition, finalRotation, shipColor, 0.3);
    });
  });

  defineExitSystem(world, [Has(HoveredShip)], (update) => {
    [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
      const objectId = `optionGhost-${moveCardEntity}`;
      objectPool.remove(objectId);
    });
  });
}
