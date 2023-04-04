import { tween } from "@latticexyz/phaserx";
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
import { colors } from "../../styles/global";
import { world } from "../../world";
import { sprites } from "../phaser/config";
import { POS_HEIGHT, RenderDepth } from "../phaser/constants";
import { HoverType, Phase, SetupResult, Sprites } from "../types";
import { distance } from "../utils/distance";
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
    gameEntity,
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

  function getCrateSprite(componentId: string, amount: number) {
    if (componentId == keccak256("ds.component.Firepower"))
      return amount == 2 ? Sprites.FirepowerCrate2 : Sprites.FirepowerCrate1;
    else if (componentId == keccak256("ds.component.Speed"))
      return amount == 2 ? Sprites.SpeedCrate1 : Sprites.SpeedCrate2;
    else if (componentId == keccak256("ds.component.Length"))
      return amount == 2 ? Sprites.SizeCrate1 : Sprites.SizeCrate2;
    else return amount == 2 ? Sprites.HealthCrate1 : Sprites.HealthCrate2;
  }

  async function renderCrate(crateEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, crateEntity);
    const upgrade = getComponentValueStrict(Upgrade, crateEntity);

    const group = getGroupObject(crateEntity, true);
    const spriteAsset: Sprites = getCrateSprite(upgrade.componentId, upgrade.amount);
    const sprite = sprites[spriteAsset];

    const spriteObject = phaserScene.add.sprite(position.x, position.y, sprite.assetKey, sprite.frame);
    spriteObject.setAlpha(0);
    spriteObject.setTexture(sprite.assetKey, sprite.frame);
    spriteObject.setDepth(RenderDepth.Foreground3);
    spriteObject.setScale(2);
    spriteObject.setOrigin(0.5, 0.5);
    const { x, y } = pixelCoord(position);

    spriteObject.setPosition(x, y);

    await tween({
      targets: spriteObject,
      delay: 2000,
      duration: 1000,
      props: { alpha: 1 },
      ease: Phaser.Math.Easing.Linear,
    });
    if (crateEntity == undefined) return;
    const radius = 20;

    const circle = renderCircle(group, position, radius, colors.whiteHex);

    circle.setInteractive();
    circle.setAlpha(0.1);
    circle.on("pointerover", () => {
      console.log(
        `component: ${upgrade.componentId} `,
        [...world.components].find(
          (component) => keccak256(component.metadata?.contractId as string) == upgrade.componentId
        )?.id
      );
      if (getPhase(clock.currentTime) == Phase.Action) {
        const textGroup = getGroupObject("crate-text", true);
        const selectedShip = getComponentValue(SelectedShip, gameEntity)?.value as EntityIndex | undefined;
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
  }
  defineEnterSystem(world, [Has(Position), Has(Upgrade)], ({ entity: crateEntity }) => {
    renderCrate(crateEntity);
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
      const selectedShip = getComponentValue(SelectedShip, gameEntity)?.value as EntityIndex | undefined;
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
