import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  Not,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { sprites } from "../../phaser/config";
import { Animations, POS_HEIGHT, POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Category } from "../../sound";
import { Sprites } from "../../types";
import { getShipSprite } from "../../utils/ships";
import { getMidpoint } from "../../utils/trig";

export function localHealthSystems(MUD: SetupResult) {
  const {
    world,
    components: {
      Length,
      Position,
      Rotation,
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
      SelectedActions,
      SelectedMove,
      MaxHealth,
    },
    utils: { getSpriteObject, getPlayerEntity, destroySpriteObject, playSound },
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
  defineComponentSystem(world, HealthLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    if (newVal === undefined || oldVal === undefined) return;
    const health = newVal.value;
    const maxHealth = getComponentValueStrict(MaxHealth, shipEntity)?.value;
    const shipObject = getSpriteObject(shipEntity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, shipEntity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, maxHealth, playerEntity == ownerEntity);

    const sprite = sprites[spriteAsset];

    shipObject.setTexture(sprite.assetKey, sprite.frame);

    if (health == 0) {
      playDeathAnimation(shipEntity);
      removeComponent(SelectedActions, shipEntity);
      removeComponent(SelectedMove, shipEntity);
      shipObject.setAlpha(0.5);
      shipObject.setDepth(RenderDepth.Foreground4);
      shipObject.off("pointerdown");
      shipObject.off("pointerover");
      shipObject.off("pointerout");
      shipObject.disableInteractive();
    } else {
      shipObject.setAlpha(1);
      shipObject.setDepth(RenderDepth.Foreground3);
      shipObject.setInteractive({ cursor: "pointer" });
      shipObject.off("pointerdown");
      shipObject.off("pointerover");
      shipObject.off("pointerout");

      shipObject.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: shipEntity }));
      shipObject.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: shipEntity }));
      shipObject.on("pointerout", () => removeComponent(HoveredShip, godEntity));
    }
  });

  function playDeathAnimation(shipEntity: EntityIndex) {
    const shipMidpoint = getShipMidpoint(shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value;
    const width = length / (1.5 * SHIP_RATIO);

    for (let i = 0; i < 20; i++) {
      const explosionId = `deathexplosion-${shipEntity}-${i}`;

      const randX = Math.random() * width * 2 - width;
      const randY = Math.random() * width * 2 - width;
      const end = { x: shipMidpoint.x + randX * POS_HEIGHT, y: shipMidpoint.y + randY * POS_HEIGHT };

      explode(explosionId, end, i * 100);
    }
  }

  function getShipMidpoint(shipEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
    const length = getComponentValue(Length, shipEntity)?.value || 10;
    const midpoint = getMidpoint(position, rotation, length);

    return tileCoordToPixelCoord(midpoint, POS_WIDTH, POS_HEIGHT);
  }

  async function explode(explosionId: string, position: Coord, delay?: number) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const explosion = getSpriteObject(explosionId);
    explosion.setOrigin(0.5, 0.5);
    playSound("impact_ship_1", Category.Combat);
    explosion.setPosition(position.x, position.y);
    explosion.setDepth(RenderDepth.UI5);
    explosion.play(Animations.Explosion);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    destroySpriteObject(explosionId);
  }
}
