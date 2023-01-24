import {
  defineComponentSystem,
  defineExitSystem,
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
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
    components: { Position, Rotation, SailPosition, MoveCard, Speed, SelectedShip, SelectedMove, HoveredMove },
    utils: { destroySpriteObject, getPhase, isMyShip },
    godIndex,
  } = phaser;
  /* ---------------------------------------------- Move Options update ------------------------------------------- */
  defineComponentSystem(world, SelectedShip, (update) => {
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
      destroySpriteObject(objectId);
      const shipObject = renderShip(phaser, shipEntity, objectId, finalPosition, finalRotation, shipColor, 0.3);
      shipObject.setInteractive();
      shipObject.on("pointerdown", () => setComponent(SelectedMove, shipEntity, { value: moveCardEntity }));
      shipObject.on("pointerover", () => setComponent(HoveredMove, godIndex, { shipEntity, moveCardEntity }));
      shipObject.on("pointerout", () => removeComponent(HoveredMove, godIndex));
    });
  });

  defineExitSystem(world, [Has(SelectedShip)], () => {
    [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
      const objectId = `optionGhost-${moveCardEntity}`;

      destroySpriteObject(objectId);
    });
  });
}
