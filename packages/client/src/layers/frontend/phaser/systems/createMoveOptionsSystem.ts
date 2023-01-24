import {
  defineComponentSystem,
  defineExitSystem,
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  Has,
} from "@latticexyz/recs";
import { Phase } from "../../../../types";
import { getFinalPosition } from "../../../../utils/directions";
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
      },
    },
    utils: { destroySpriteObject },
  } = phaser;
  /* ---------------------------------------------- Move Options update ------------------------------------------- */
  defineComponentSystem(world, HoveredShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const phase: Phase | undefined = getPhase(DELAY);
    if (phase != Phase.Commit) return;

    const moveCardEntities = [...getComponentEntities(MoveCard)];
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    moveCardEntities.map((moveCardEntity) => {
      const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);

      const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);
      const shipColor = colors.whiteHex;

      const objectId = `optionGhost-${moveCardEntity}`;
      renderShip(phaser, shipEntity, objectId, finalPosition, finalRotation, shipColor, 0.3);
    });
  });

  defineExitSystem(world, [Has(HoveredShip)], () => {
    [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
      const objectId = `optionGhost-${moveCardEntity}`;

      destroySpriteObject(objectId);
    });
  });
}
