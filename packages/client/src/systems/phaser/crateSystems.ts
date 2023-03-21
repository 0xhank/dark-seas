import {
  defineComponentSystem,
  defineEnterSystem,
  EntityIndex,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { world } from "../../mud/world";
import { sprites } from "../../phaser/config";
import { RenderDepth } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { HoverType, Sprites } from "../../types";
export function crateSystems(MUD: SetupResult) {
  const {
    components: { Position, Upgrade, HoveredSprite },
    scene: { phaserScene },
    utils: { getSpriteObject, pixelCoord, getGroupObject, renderCircle },
  } = MUD;

  defineEnterSystem(world, [Has(Position), Has(Upgrade)], ({ entity: crateEntity }) => {
    const position = getComponentValueStrict(Position, crateEntity);
    const upgrade = getComponentValueStrict(Upgrade, crateEntity);

    const group = getGroupObject(crateEntity, true);
    const spriteAsset: Sprites = Sprites.Cannon;
    const sprite = sprites[spriteAsset];
    const spriteObject = phaserScene.add.sprite(position.x, position.y, sprite.assetKey, sprite.frame);

    if (crateEntity == undefined) return;
    const radius = 20;

    renderCircle(group, position, radius, colors.whiteHex, 0.1);

    spriteObject.setTexture(sprite.assetKey, sprite.frame);

    spriteObject.setInteractive({ cursor: "pointer" });
    spriteObject.setDepth(RenderDepth.Foreground3);
    spriteObject.setScale(5);
    spriteObject.setOrigin(0.5, 0.5);
    const { x, y } = pixelCoord(position);

    spriteObject.setPosition(x, y);
    spriteObject.on("pointerover", () => setComponent(HoveredSprite, HoverType.CRATE, { value: crateEntity }));
    spriteObject.on("pointerout", () => removeComponent(HoveredSprite, HoverType.CRATE));

    group.add(spriteObject);
  });

  defineComponentSystem(world, HoveredSprite, (update) => {
    console.log("update: ", update);
    if (update.entity !== HoverType.CRATE) return;
    const crateEntity = update.value[0]?.value as EntityIndex | undefined;
    const groupId = "hover-circle";
    const hoveredGroup = getGroupObject(groupId, true);
    if (crateEntity == undefined) return;
    const position = getComponentValueStrict(Position, crateEntity);
    const radius = 20;

    renderCircle(hoveredGroup, position, radius, colors.whiteHex, 0.1);
  });
}
