import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { sprites } from "../../phaser/config";
import { Animations, POS_HEIGHT, POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
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
      SelectedShip,
      HealthBackend,
      HoveredShip,
      Health,
      OwnedBy,
      SelectedActions,
      SelectedMove,
      MaxHealth,
    },
    utils: { isMyShip, getSpriteObject, getPlayerEntity, destroySpriteObject, playSound },
    scene: { phaserScene },
    godEntity,
  } = MUD;

  // HEALTH UPDATES
  defineComponentSystem(world, HealthLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    if (newVal === undefined || oldVal === undefined) return;
    const health = newVal.value;
    const oldHealth = oldVal.value;
    const maxHealth = getComponentValueStrict(MaxHealth, shipEntity)?.value;
    const shipObject = getSpriteObject(shipEntity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, shipEntity)?.value);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, maxHealth, playerEntity == ownerEntity);

    const sprite = sprites[spriteAsset];

    shipObject.setTexture(sprite.assetKey, sprite.frame);

    shipObject.setInteractive({ cursor: "pointer" });
    shipObject.on("pointerover", () => setComponent(HoveredShip, godEntity, { value: shipEntity }));
    shipObject.off("pointerdown");
    shipObject.on("pointerout", () => removeComponent(HoveredShip, godEntity));
    if (health <= 0) {
      const contractHealth = getComponentValueStrict(Health, shipEntity).value;
      if (contractHealth !== health) {
        setComponent(HealthLocal, shipEntity, { value: contractHealth });
        setComponent(HealthBackend, shipEntity, { value: contractHealth });
        return;
      }
      playDeathAnimation(shipEntity);
      removeComponent(SelectedActions, shipEntity);
      removeComponent(SelectedMove, shipEntity);
      shipObject.setAlpha(0.5);
      shipObject.setDepth(RenderDepth.Foreground4);
      for (let i = 0; i < 4; i++) {
        const spriteId = `${shipEntity}-fire-${i}`;
        destroySpriteObject(spriteId);
      }
    } else {
      shipObject.setAlpha(1);
      shipObject.setDepth(RenderDepth.Foreground3);
      shipObject.on("pointerdown", () => setComponent(SelectedShip, godEntity, { value: shipEntity }));

      if (oldHealth > 0 && health > oldHealth) {
        console.log(`${shipEntity} health increase: old ${oldHealth} new ${health}`);
        flashGreen(shipEntity);
      }
    }
  });
  async function flashGreen(shipEntity: EntityIndex) {
    const object = getSpriteObject(shipEntity);
    const delay = 200;
    const repeat = 4;

    for (let i = 0; i < repeat; i++) {
      phaserScene.time.addEvent({
        delay: (delay * i) / 2,
        callback: function () {
          object.setTint(colors.greenHex);
        },
        callbackScope: phaserScene,
      });

      phaserScene.time.addEvent({
        delay: delay * i,
        callback: function () {
          object.clearTint();
        },
        callbackScope: phaserScene,
      });
    }
  }
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
