import {
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
} from "@latticexyz/recs";
import { keccak256 } from "@latticexyz/utils";
import { world } from "../../mud/world";
import { sprites } from "../../phaser/config";
import { POS_HEIGHT, RenderDepth } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { HoverType, Phase, Sprites } from "../../types";
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
      renderCircle,
      isMyShip,
      handleNewActionsCrate,
      getPlayerShipsWithActions,
    },
    godEntity,
  } = MUD;

  defineExitSystem(world, [Has(Position)], ({ entity }) => {
    console.log("no more position");
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
  defineEnterSystem(world, [Has(Position), Has(Upgrade)], ({ entity: crateEntity }) => {
    const position = getComponentValueStrict(Position, crateEntity);
    const upgrade = getComponentValueStrict(Upgrade, crateEntity);

    const group = getGroupObject(crateEntity, true);
    const spriteAsset: Sprites = Sprites.Cannon;
    const sprite = sprites[spriteAsset];
    const spriteObject = phaserScene.add.sprite(position.x, position.y, sprite.assetKey, sprite.frame);

    if (crateEntity == undefined) return;
    const radius = 20;

    const circle = renderCircle(group, position, radius, colors.whiteHex);

    spriteObject.setTexture(sprite.assetKey, sprite.frame);

    circle.setInteractive();
    circle.setAlpha(0.1);
    spriteObject.setDepth(RenderDepth.Foreground3);
    spriteObject.setScale(5);
    spriteObject.setOrigin(0.5, 0.5);
    const { x, y } = pixelCoord(position);

    spriteObject.setPosition(x, y);
    circle.on("pointerover", () => {
      console.log(
        `component: ${upgrade.componentId} `,
        [...world.components].find(
          (component) => keccak256(component.metadata?.contractId as string) == upgrade.componentId
        )?.id
      );
      if (getPhase(clock.currentTime) == Phase.Action) {
        const textGroup = getGroupObject("crate-text", true);
        const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;
        if (
          !selectedShip ||
          !isMyShip(selectedShip) ||
          distance(position, getComponentValueStrict(Position, selectedShip)) > 20
        )
          return;
        circle.setInteractive({ cursor: "pointer" });
        circle.setAlpha(0.3);
        const text = phaserScene.add.text(0, 0, "PICK UP CRATE", {
          color: colors.white,
          align: "center",
          fontFamily: "Inknut Antiqua",
          fontSize: "40px",
        });

        text.setPosition(position.x * POS_HEIGHT - text.displayWidth / 2, position.y * POS_HEIGHT + 80);
        circle.setInteractive();
        circle.on("pointerup", () => handleNewActionsCrate(selectedShip, crateEntity));

        textGroup.add(text);
        textGroup.setDepth(RenderDepth.Foreground2);
      }
    });

    circle.on("pointerout", () => {
      circle.setInteractive();
      circle.setAlpha(0.1);
      circle.off("pointerup");
      destroyGroupObject("crate-text");
      destroyGroupObject("crate-circle");
    });

    group.add(spriteObject);
  });

  defineComponentSystem(world, HoveredSprite, (update) => {
    if (update.entity !== HoverType.CRATE) return;
    const crateEntity = update.value[0]?.value as EntityIndex | undefined;
    const groupId = "hover-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (crateEntity == undefined) return;
    const position = getComponentValueStrict(Position, crateEntity);
    const radius = 20;

    const circle = renderCircle(hoveredGroup, position, radius, colors.whiteHex, 0.1);
    if (getPhase(clock.currentTime) == Phase.Action) {
      const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;
      if (
        !selectedShip ||
        !isMyShip(selectedShip) ||
        distance(position, getComponentValueStrict(Position, selectedShip)) > 20
      )
        return;
      const textGroup = phaserScene.add.text(0, 0, "PICKUP CRATE", {
        color: colors.white,
        align: "center",
        fontFamily: "Inknut Antiqua",
        fontSize: "40px",
      });

      textGroup.setPosition(position.x * POS_HEIGHT - textGroup.displayWidth / 2, position.y * POS_HEIGHT + 80);
      circle.setInteractive();
      circle.on("pointerup", () => handleNewActionsCrate(selectedShip, crateEntity));

      hoveredGroup.add(textGroup);
      hoveredGroup.setDepth(RenderDepth.Foreground2);
    }
  });
}
