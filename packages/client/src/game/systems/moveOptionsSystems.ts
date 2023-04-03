import {
  defineComponentSystem,
  defineExitSystem,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { colors } from "../../styles/global";
import { Phase, SetupResult } from "../types";
import { getFinalPosition } from "../utils/directions";

export function moveOptionsSystems(MUD: SetupResult) {
  const {
    world,
    components: {
      Position,
      Rotation,
      SailPositionLocal,
      MoveCard,
      Speed,
      Health,
      SelectedShip,
      SelectedMove,
      HoveredMove,
    },
    utils: { destroySpriteObject, getPhase, isMyShip, renderShip, destroyGroupObject, renderShipFiringAreas },
    godEntity,
    network: { clock },
  } = MUD;
  /* ---------------------------------------------- Move Options update ------------------------------------------- */

  defineComponentSystem(world, SelectedMove, ({ entity: shipEntity }) => {
    if (!shipEntity) return;
    renderShipOptions(shipEntity);
  });

  defineComponentSystem(world, SelectedShip, (update) => {
    const shipEntity = update.value[0]?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const health = getComponentValue(Health, shipEntity)?.value;
    if (!health) return;
    renderShipOptions(shipEntity);
  });

  defineExitSystem(world, [Has(SelectedShip)], () => {
    [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
      const objectId = `optionGhost-${moveCardEntity}`;

      destroySpriteObject(objectId);
    });
  });

  function renderShipOptions(shipEntity: EntityIndex) {
    const time = clock.currentTime;
    const phase: Phase | undefined = getPhase(time);
    if (phase != Phase.Commit) return;

    const moveCardEntities = [...getComponentEntities(MoveCard)];
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const sailPosition = getComponentValueStrict(SailPositionLocal, shipEntity).value;
    const speed = getComponentValueStrict(Speed, shipEntity).value;
    const selectedMove = getComponentValue(SelectedMove, shipEntity)?.value;

    moveCardEntities.map((moveCardEntity) => {
      const moveCard = getComponentValueStrict(MoveCard, moveCardEntity);
      const isSelected = selectedMove && selectedMove == moveCardEntity;

      const { finalPosition, finalRotation } = getFinalPosition(moveCard, position, rotation, speed, sailPosition);
      const shipColor = colors.whiteHex;

      const objectId = `optionGhost-${moveCardEntity}`;
      destroySpriteObject(objectId);
      const shipObject = renderShip(shipEntity, objectId, finalPosition, finalRotation, shipColor, 0.3);
      if (!shipObject) return;
      shipObject.setInteractive({ cursor: "pointer" });
      shipObject.on("pointerup", () => {
        if (!isMyShip(shipEntity)) return;
        if (isSelected) return removeComponent(SelectedMove, shipEntity);
        setComponent(SelectedMove, shipEntity, { value: moveCardEntity });
      });
      shipObject.on("pointerover", () => setComponent(HoveredMove, godEntity, { shipEntity, moveCardEntity }));
      shipObject.on("pointerout", () => {
        removeComponent(HoveredMove, godEntity);
        destroyGroupObject("activeShip");
      });
    });
  }
}
