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
    scenes: {
      Main: { objectPool, config },
    },
  } = phaser;

  defineEnterSystem(world, [Has(Health)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(LocalHealth, entity, { value: health });
  });

  // HEALTH UPDATES
  defineComponentSystem(world, Health, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;
    const health = update.value[0].value;
    const object = objectPool.get(update.entity, "Sprite");
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);

    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];
    object.setComponent({
      id: `texture`,
      once: (ship) => {
        ship.setTexture(sprite.assetKey, sprite.frame);

        if (health == 0) {
          ship.setAlpha(0.5);
          ship.setDepth(RenderDepth.Foreground4);
        } else {
          ship.setAlpha(1);
          ship.setDepth(RenderDepth.Foreground3);
        }
      },
    });

    object.setComponent({
      id: "interactive",
      once: (ship) => {
        if (health == 0) {
          ship.off("pointerdown");
          ship.off("pointerover");
          ship.off("pointerout");
          ship.disableInteractive();
        } else {
          ship.setInteractive();
          ship.off("pointerdown");
          ship.off("pointerover");
          ship.off("pointerout");

          ship.on("pointerdown", () => setComponent(SelectedShip, godIndex, { value: update.entity }));
          ship.on("pointerover", () => setComponent(HoveredShip, godIndex, { value: update.entity }));
          ship.on("pointerout", () => removeComponent(HoveredShip, godIndex));
        }
      },
    });
  });
}
