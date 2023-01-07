import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineEnterSystem,
  defineExitSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
  UpdateType,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getShipSprite } from "../../../../utils/ships";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createPositionSystem(phaser: PhaserLayer) {
  const {
    world,
    scenes: {
      Main: { objectPool, config, camera },
    },
    parentLayers: {
      network: {
        components: { Position, Length, Rotation, OwnedBy, Health },
        utils: { getPlayerEntity },
        network: { connectedAddress },
      },
      backend: {
        components: { SelectedShip, SelectedMove, HoveredShip },
      },
    },
    polygonRegistry,
    positions,
  } = phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  defineExitSystem(world, [Has(Position), Has(Rotation)], (update) => {
    objectPool.remove(update.entity);
  });

  defineEnterSystem(world, [Has(Position), Has(OwnedBy)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, update.entity).value);
    const playerEntity = getPlayerEntity(connectedAddress.get());

    if (!ownerEntity || !playerEntity || ownerEntity !== playerEntity) return;

    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);
  });

  defineSystem(world, [Has(Health), Has(OwnedBy)], (update) => {
    const object = objectPool.get(update.entity, "Sprite");
    const health = getComponentValueStrict(Health, update.entity).value;
    const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, update.entity).value);
    const playerEntity = getPlayerEntity();
    if (!playerEntity || !ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(playerEntity, health, playerEntity == ownerEntity);
    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];
    object.setComponent({
      id: `health-${update.entity}`,
      once: (gameObject) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        if (health == 0) {
          gameObject.setAlpha(0.5);
          gameObject.disableInteractive();
          gameObject.setDepth(RenderDepth.Foreground4);
        } else {
          gameObject.setAlpha(1);
          gameObject.setDepth(RenderDepth.Foreground3);
        }
      },
    });
  });

  defineSystem(world, [Has(Position), Has(Rotation), Has(Length), Has(OwnedBy), Has(Health)], (update) => {
    const rangeGroup = polygonRegistry.get(`rangeGroup-${update.entity}`);
    const activeGroup = polygonRegistry.get(`activeGroup`);
    const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, update.entity).value);
    const playerEntity = getPlayerEntity();

    if (!ownerEntity) return null;

    if (rangeGroup) rangeGroup.clear(true, true);
    if (activeGroup) activeGroup.clear(true, true);
    objectPool.remove(`projection-${update.entity}`);
    removeComponent(SelectedMove, update.entity);
    if (update.entity == getComponentValue(SelectedShip, GodEntityIndex)?.value) {
      removeComponent(SelectedShip, GodEntityIndex);
    }

    const length = getComponentValueStrict(Length, update.entity).value;
    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);
    const health = getComponentValueStrict(Health, update.entity).value;

    const object = objectPool.get(update.entity, "Sprite");

    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, playerEntity == ownerEntity);
    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: `position-${update.entity}`,
      now: async (gameObject) => {
        if (update.type == UpdateType.Enter) return;
        await tween({
          targets: gameObject,
          duration: 2000,
          props: {
            x,
            y,
            angle: {
              getEnd: function (target, key, value) {
                const start = target.angle % 360;
                const end = (rotation - 90) % 360;

                let diff = end - start;

                if (diff < -180) diff += 360;
                else if (diff > 180) diff -= 360;

                return start + diff;
              },

              getStart: function (target, key, value) {
                return target.angle % 360;
              },
            },
          },

          ease: Phaser.Math.Easing.Sine.InOut,
        });
      },
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle((rotation - 90) % 360);
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        gameObject.setOrigin(0.5, 0.92);
        gameObject.setDisplaySize(shipWidth, shipLength);
        gameObject.setPosition(x, y);
        gameObject.setDepth(RenderDepth.Foreground3);
        if (health != 0) {
          gameObject.setInteractive();
          gameObject.off("pointerdown");
          gameObject.off("pointerover");
          gameObject.off("pointerout");

          gameObject.on("pointerdown", () => setComponent(SelectedShip, GodEntityIndex, { value: update.entity }));
          gameObject.on("pointerover", () => setComponent(HoveredShip, GodEntityIndex, { value: update.entity }));
          gameObject.on("pointerout", () => removeComponent(HoveredShip, GodEntityIndex));
        }
      },
    });
  });
}
