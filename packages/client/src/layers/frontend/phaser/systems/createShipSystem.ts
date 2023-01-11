import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
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
import { CANNON_SHOT_LENGTH, RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function createShipSystem(phaser: PhaserLayer) {
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

  // HEALTH UPDATES
  defineComponentSystem(world, Health, (update) => {
    const health = update.value[0]?.value;
    if (health == undefined) return;
    const object = objectPool.get(update.entity, "Sprite");
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity();
    if (!playerEntity || !ownerEntity) return null;

    const spriteAsset: Sprites = getShipSprite(playerEntity, health, playerEntity == ownerEntity);
    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];
    object.setComponent({
      id: `texture`,
      once: (gameObject) => {
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        if (health == 0) {
          gameObject.setAlpha(0.5);
          gameObject.setDepth(RenderDepth.Foreground4);
        } else {
          gameObject.setAlpha(1);
          gameObject.setDepth(RenderDepth.Foreground3);
        }
      },
    });

    const length = getComponentValue(Length, update.entity)?.value || 0;

    object.setComponent({
      id: "len",
      once: (sprite) => {
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        sprite.setDisplaySize(shipWidth, shipLength);
        sprite.setOrigin(0.5, 0.92);
      },
    });

    object.setComponent({
      id: "interactive",
      once: (gameObject) => {
        if (health == 0) {
          gameObject.off("pointerdown");
          gameObject.off("pointerover");
          gameObject.off("pointerout");
          gameObject.disableInteractive();
        } else {
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

  // LENGTH UPDATES
  defineComponentSystem(world, Length, (update) => {
    if (update.component != Length) return;
    const length = (update.value[0]?.value as number) || 0;
    const object = objectPool.get(update.entity, "Sprite");

    console.log(`${update.entity} length: ${length}`);

    object.setComponent({
      id: "len",
      once: (sprite) => {
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        sprite.setDisplaySize(shipWidth, shipLength);
        sprite.setOrigin(0.5, 0.92);
      },
    });
  });

  // Position and Rotation updates
  defineSystem(world, [Has(Position), Has(Rotation)], (update) => {
    const object = objectPool.get(update.entity, "Sprite");

    if (update.type == UpdateType.Exit) {
      object.setComponent({
        id: "interactive",
        once: (gameObject) => {
          gameObject.off("pointerdown");
          gameObject.off("pointerover");
          gameObject.off("pointerout");
          gameObject.disableInteractive();
        },
      });
      objectPool.remove(update.entity);
    }

    polygonRegistry.get(`rangeGroup-${update.entity}`)?.clear(true, true);
    objectPool.remove(`projection-${update.entity}`);
    removeComponent(SelectedMove, update.entity);
    if (update.entity == getComponentValue(SelectedShip, GodEntityIndex)?.value) {
      removeComponent(SelectedShip, GodEntityIndex);
    }

    const rotation = getComponentValueStrict(Rotation, update.entity).value;
    const position = getComponentValueStrict(Position, update.entity);

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: "position-rotation",
      now: async (gameObject) => {
        if (update.type == UpdateType.Enter) return;
        await tween({
          targets: gameObject,
          duration: CANNON_SHOT_LENGTH,
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
        gameObject.setAngle((rotation - 90) % 360);
        gameObject.setPosition(x, y);
      },
    });
  });

  // CENTER ON SHIP WHEN IT SPAWNS
  defineEnterSystem(world, [Has(OwnedBy), Has(Position)], (update) => {
    const position = getComponentValue(Position, update.entity);
    const ownerEntity = getPlayerEntity(getComponentValue(OwnedBy, update.entity)?.value);
    const playerEntity = getPlayerEntity(connectedAddress.get());

    if (!position || !ownerEntity || !playerEntity || ownerEntity !== playerEntity) return;

    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);
  });
}
