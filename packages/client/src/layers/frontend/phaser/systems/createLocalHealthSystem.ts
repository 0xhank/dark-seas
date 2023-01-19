import {
  defineComponentSystem,
  defineEnterSystem,
  getComponentValue,
  Has,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getShipSprite } from "../../../../utils/ships";
import { RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createLocalHealthSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Health, OwnedBy },
        utils: { getPlayerEntity },
      },
      backend: {
        components: { LocalHealth, SelectedShip, HoveredShip },
        godIndex,
      },
    },
    utils: { getSpriteObject },
    scenes: {
      Main: { config },
    },
  } = phaser;

  defineEnterSystem(world, [Has(Health)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(LocalHealth, entity, { value: health });
  });

  // HEALTH UPDATES
  defineComponentSystem(world, LocalHealth, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;
    const health = update.value[0].value;
    const shipObject = getSpriteObject(update.entity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);

    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];

    shipObject.setTexture(sprite.assetKey, sprite.frame);

    if (health == 0) {
      shipObject.setAlpha(0.5);
      shipObject.setDepth(RenderDepth.Foreground4);
    } else {
      shipObject.setAlpha(1);
      shipObject.setDepth(RenderDepth.Foreground3);
    }

    if (health == 0) {
      shipObject.off("pointerdown");
      shipObject.off("pointerover");
      shipObject.off("pointerout");
      shipObject.disableInteractive();
    } else {
      shipObject.setInteractive();
      shipObject.off("pointerdown");
      shipObject.off("pointerover");
      shipObject.off("pointerout");

      shipObject.on("pointerdown", () => setComponent(SelectedShip, godIndex, { value: update.entity }));
      shipObject.on("pointerover", () => setComponent(HoveredShip, godIndex, { value: update.entity }));
      shipObject.on("pointerout", () => removeComponent(HoveredShip, godIndex));
    }
  });
}
