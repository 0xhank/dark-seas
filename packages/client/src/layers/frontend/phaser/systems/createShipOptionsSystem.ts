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
import { DELAY } from "../../constants";
import { colors } from "../../react/styles/global";
import { PhaserLayer } from "../types";
import { renderShip } from "./renderShip";

export function createShipOptionsSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Wind, Position, Range, Length, Rotation, SailPosition, MoveCard, Health, Cannon, OwnedBy },
        utils: { getPhase },
      },
      backend: {
        components: { SelectedMove, HoveredShip, SelectedShip },
        godIndex,
      },
    },
    scenes: {
      Main: { objectPool, phaserScene },
    },
    polygonRegistry,
  } = phaser;
  /* ---------------------------------------------- Move Options update ------------------------------------------- */
  defineSystem(world, [Has(HoveredShip)], (update) => {
    if (update.type == UpdateType.Exit) return;

    if (getPhase(DELAY) !== Phase.Commit) return;
    const shipEntity = getComponentValueStrict(HoveredShip, godIndex).value as EntityIndex;

    const moveCardEntities = [...getComponentEntities(MoveCard)];

    moveCardEntities.map((moveCardEntity) => {
      const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
      const position = getComponentValueStrict(Position, shipEntity);
      const rotation = getComponentValueStrict(Rotation, shipEntity).value;
      const wind = getComponentValueStrict(Wind, godIndex);
      const sailPosition = getComponentValueStrict(SailPosition, shipEntity).value;
      const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, sailPosition, wind);

      const objectId = `optionGhost-${moveCardEntity}`;
      renderShip(phaser, shipEntity, objectId, finalPosition, finalRotation, colors.whiteHex, 0.3);

      //   objectPool.get(objectId, "Sprite").setComponent({
      //     id: objectId,
      //     once: (gameObject) => {
      //       gameObject.setInteractive();
      //       gameObject.off("pointerdown");
      //       gameObject.off("pointerover");
      //       gameObject.off("pointerout");

      //       gameObject.on("pointerover", () => setComponent(HoveredMove, godIndex, { shipEntity, moveCardEntity }));
      //       gameObject.on("pointerdown", () => setComponent(SelectedMove, shipEntity, { value: moveCardEntity }));
      //       gameObject.on("pointerout", () => removeComponent(HoveredMove, godIndex));
      //     },
      //   });
    });
  });

  defineExitSystem(world, [Has(HoveredShip)], (update) => {
    [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
      const objectId = `optionGhost-${moveCardEntity}`;
      objectPool.remove(objectId);
    });
  });
}
