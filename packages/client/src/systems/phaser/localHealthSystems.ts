import {
  defineComponentSystem,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { sprites } from "../../phaser/config";
import { RenderDepth } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Sprites } from "../../types";
import { getShipSprite } from "../../utils/ships";

export function localHealthSystems(MUD: SetupResult) {
  const {
    world,
    components: { HealthLocal, SelectedShip, HoveredShip, OwnedBy, SelectedActions, SelectedMove, MaxHealth },
    utils: { getSpriteObject, getPlayerEntity },
    scene: { config },
    godEntity,
  } = MUD;

  // HEALTH UPDATES
  defineComponentSystem(world, HealthLocal, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;
    const health = update.value[0].value;
    const maxHealth = getComponentValueStrict(MaxHealth, update.entity)?.value;
    const shipObject = getSpriteObject(update.entity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, maxHealth, playerEntity == ownerEntity);

    const sprite = sprites[spriteAsset];

    shipObject.setTexture(sprite.assetKey, sprite.frame);

    if (health == 0) {
      removeComponent(SelectedActions, update.entity);
      removeComponent(SelectedMove, update.entity);
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
      shipObject.setInteractive({ cursor: "pointer" });
      shipObject.off("pointerdown");
      shipObject.off("pointerover");
      shipObject.off("pointerout");

      shipObject.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: update.entity }));
      shipObject.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: update.entity }));
      shipObject.on("pointerout", () => removeComponent(HoveredShip, godEntity));
    }
  });
}
