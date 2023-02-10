import {
  defineComponentSystem,
  defineEnterSystem,
  defineSystem,
  getComponentValue,
  Has,
  Not,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { sprites } from "../../phaser/config";
import { RenderDepth } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Sprites } from "../../types";
import { getShipSprite } from "../../utils/ships";

export function createHealthLocalSystem(MUD: SetupResult) {
  const {
    world,
    components: {
      HealthLocal,
      OnFireLocal,
      SelectedShip,
      HoveredShip,
      DamagedCannonsLocal,
      SailPositionLocal,
      Health,
      OwnedBy,
      OnFire,
      DamagedCannons,
      SailPosition,
      HealthBackend,
    },
    utils: { getSpriteObject, getPlayerEntity },
    scene: { config },
    godEntity,
  } = MUD;

  defineSystem(world, [Has(Health)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    const oldHealth = value[1]?.value as number | undefined;
    if (health == undefined || !!oldHealth) return;
    setComponent(HealthLocal, entity, { value: health });
    setComponent(HealthBackend, entity, { value: health });
  });

  defineEnterSystem(world, [Has(OnFire), Not(OnFireLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(OnFireLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(DamagedCannons), Not(DamagedCannonsLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(DamagedCannonsLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(SailPosition), Not(SailPositionLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(SailPositionLocal, entity, { value: health });
  });

  // HEALTH UPDATES
  defineComponentSystem(world, HealthLocal, (update) => {
    if (update.value[0] === undefined || update.value[1] === undefined) return;
    const health = update.value[0].value;
    const shipObject = getSpriteObject(update.entity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);

    const sprite = sprites[spriteAsset];

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

      shipObject.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: update.entity }));
      shipObject.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: update.entity }));
      shipObject.on("pointerout", () => removeComponent(HoveredShip, godEntity));
    }
  });
}
