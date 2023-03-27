import {
  defineEnterSystem,
  defineExitSystem,
  defineRxSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  runQuery,
} from "@latticexyz/recs";
import { keccak256 } from "@latticexyz/utils";
import { world } from "../../mud/world";
import { sprites } from "../../phaser/config";
import { POS_HEIGHT, RenderDepth } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { Phase, Sprites } from "../../types";
import { distance } from "../../utils/distance";
export function crateSystems(MUD: SetupResult) {
  const {
    components: { Position, Upgrade, HoveredSprite, SelectedShip, SelectedActions },
    scene: { phaserScene },
    network: { clock },
    utils: {
      destroySpriteObject,
      destroyGroupObject,
      pixelCoord,
      getPhase,
      getGroupObject,
      getPlayerShips,
      renderCircle,
      isMyShip,
      handleNewActionsCrate,
      getPlayerShipsWithActions,
      getGameConfig,
      secondsUntilNextPhase,
    },
    godEntity,
  } = MUD;

  defineExitSystem(world, [Has(Position)], ({ entity }) => {
    destroyGroupObject(entity);
    destroySpriteObject(entity);

    // if the entity was a crate entity and someone else took it, remove it from your staged actions.
    const selectedActions = getPlayerShipsWithActions();
    selectedActions.forEach((action) => {
      const shipEntity = world.entityToIndex.get(action.shipEntity);
      if (!shipEntity) return;
      action.specialEntities.forEach((specialEntity) => {
        if (specialEntity == world.entities[entity]) {
          handleNewActionsCrate(shipEntity, entity);
        }
      });
    });
  });

  defineRxSystem(world, clock.time$, (time) => {
    const phase = getPhase(time);
    const gameConfig = getGameConfig();
    const timeToNextPhase = secondsUntilNextPhase(time);
    const crateEntities = [...runQuery([Has(Upgrade), Has(Position)])];
    if (phase == Phase.Reveal && timeToNextPhase == 1) {
      const myShips = getPlayerShips();
      crateEntities.forEach((crateEntity) => {
        const position = getComponentValueStrict(Position, crateEntity);
        const ship = myShips.find((ship) => {
          const shipPosition = getComponentValueStrict(Position, ship);
          return distance(shipPosition, position) < 20;
        });
        renderCrate(crateEntity, ship);
      });
    } else if (phase == Phase.Commit && timeToNextPhase == gameConfig?.commitPhaseLength) {
      crateEntities.forEach((crateEntity) => {
        renderCrate(crateEntity, undefined);
      });
    }
  });

  function getCrateSprite(componentId: string, amount: number) {
    if (componentId == keccak256("ds.component.Firepower"))
      return amount == 2 ? Sprites.FirepowerCrate2 : Sprites.FirepowerCrate1;
    else if (componentId == keccak256("ds.component.Speed"))
      return amount == 2 ? Sprites.SpeedCrate1 : Sprites.SpeedCrate2;
    else if (componentId == keccak256("ds.component.Length"))
      return amount == 2 ? Sprites.SizeCrate1 : Sprites.SizeCrate2;
    else return amount == 2 ? Sprites.HealthCrate1 : Sprites.HealthCrate2;
  }

  async function renderCrate(crateEntity: EntityIndex, ship: EntityIndex | undefined) {
    const position = getComponentValueStrict(Position, crateEntity);
    const upgrade = getComponentValueStrict(Upgrade, crateEntity);
    const group = getGroupObject(crateEntity, true);
    const spriteAsset: Sprites = getCrateSprite(upgrade.componentId, upgrade.amount);
    const sprite = sprites[spriteAsset];

    const spriteObject = phaserScene.add.sprite(position.x, position.y, sprite.assetKey, sprite.frame);
    spriteObject.setTexture(sprite.assetKey, sprite.frame);
    spriteObject.setDepth(RenderDepth.Foreground3);
    spriteObject.setScale(2);
    spriteObject.setOrigin(0.5, 0.5);
    const { x, y } = pixelCoord(position);

    spriteObject.setPosition(x, y);

    if (crateEntity == undefined) return;
    const radius = 20;

    const circle = renderCircle(group, position, radius, colors.whiteHex);

    circle.setAlpha(0.1);
    if (ship) {
      circle.setAlpha(0.25);
      circle.setInteractive({ cursor: "pointer" });

      const text = phaserScene.add.text(0, 0, "PICK UP CRATE", {
        color: colors.white,
        align: "center",
        fontFamily: "Inknut Antiqua",
        fontSize: "40px",
      });

      text.setPosition(position.x * POS_HEIGHT - text.displayWidth / 2, position.y * POS_HEIGHT + 80);
      group.add(text);

      circle.on("pointerover", () => {
        circle.setAlpha(0.5);
        circle.on("pointerup", () => {
          const active = getComponentValue(SelectedActions, ship)?.specialEntities.find(
            (entity) => entity == world.entities[crateEntity]
          );
          handleNewActionsCrate(ship, crateEntity);

          circle.setFillStyle(active ? colors.whiteHex : colors.goldHex);
        });
      });

      circle.on("pointerout", () => {
        circle.setAlpha(circle.fillColor == colors.goldHex ? 0.4 : 0.25);
        circle.off("pointerup");
      });
    }
    group.add(spriteObject);
    group.setDepth(RenderDepth.Foreground7);
  }
  defineEnterSystem(world, [Has(Position), Has(Upgrade)], ({ entity: crateEntity }) => {
    if (getPhase(clock.currentTime) == Phase.Action) {
      const myShips = getPlayerShips();
      const position = getComponentValueStrict(Position, crateEntity);
      const ship = myShips.find((ship) => {
        const shipPosition = getComponentValueStrict(Position, ship);
        return distance(shipPosition, position) < 20;
      });
      renderCrate(crateEntity, ship);
    } else {
      renderCrate(crateEntity, undefined);
    }
  });
}
