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
import { getPlayerEntity } from "@latticexyz/std-client";
import { NetworkLayer } from "../../network";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { getShipSprite } from "../../../utils/ships";
import { PhaserLayer } from "../types";
import { Sprites } from "../../../types";

export function createPositionSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Position, Length, Rotation, OwnedBy, Health },
    utils: { getPlayerEntity },
    network: { connectedAddress },
  } = network;

  const {
    scenes: {
      Main: { objectPool, config, camera },
    },
    components: { SelectedShip, SelectedMove },
    polygonRegistry,
    positions,
  } = phaser;

  defineExitSystem(world, [Has(Position), Has(Rotation)], (update) => {
    objectPool.remove(update.entity);
  });

  defineEnterSystem(world, [Has(Position), Has(OwnedBy), Has(Health)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const health = getComponentValueStrict(Health, update.entity);
    const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, update.entity).value);
    const playerEntity = getPlayerEntity(connectedAddress.get());

    if (!ownerEntity || !playerEntity || ownerEntity !== playerEntity) return;

    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);
    console.log(camera.phaserCamera);
    // requestAnimationFrame(() => camera.$.next(camera.phaserCamera.worldView));
    // camera.phaserCamera.zoomTo(1, 20, "Linear);
  });

  defineSystem(world, [Has(Position), Has(Rotation), Has(Length), Has(Health), Has(OwnedBy)], (update) => {
    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const rangeGroup = polygonRegistry.get(`rangeGroup-${update.entity}`);
    const activeGroup = polygonRegistry.get(`activeGroup`);
    const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, update.entity).value);
    const playerEntity = getPlayerEntity();

    if (!playerEntity || !ownerEntity) return null;

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

    const spriteAsset: Sprites = getShipSprite(playerEntity, ownerEntity, health);
    // @ts-expect-error doesnt recognize a sprite as a number
    const sprite = config.sprites[spriteAsset];
    // const sprite = config.sprites[Sprites.ShipBlack];

    const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    object.setComponent({
      id: Position.id,
      now: async (gameObject) => {
        await tween({
          targets: gameObject,
          duration: 250,
          props: {
            x,
            y,
            angle: {
              getEnd: function (target, key, value) {
                const start = target.angle % 360;
                const end = (rotation - 90) % 360;

                // console.log(`start angle: ${start}, end angle: ${end}`);

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

          ease: Phaser.Math.Easing.Linear,
        });
      },
      once: async (gameObject: Phaser.GameObjects.Sprite) => {
        gameObject.setName(update.entity.toString());
        gameObject.setTexture(sprite.assetKey, sprite.frame);

        gameObject.setAngle((rotation - 90) % 360);
        const shipLength = length * positions.posWidth * 1.25;
        const shipWidth = shipLength / SHIP_RATIO;
        gameObject.setOrigin(0.5, 0.92);
        gameObject.setDisplaySize(shipWidth, shipLength);
        gameObject.setPosition(x, y);
        gameObject.setDepth(RenderDepth.Foreground3);

        gameObject.setInteractive();
        // console.log("updated position");
        gameObject.on("pointerdown", () => {
          // console.log("you just clicked on entity", update.entity);
          const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

          setComponent(SelectedShip, GodEntityIndex, { value: update.entity });
        });
      },
    });
  });
}
