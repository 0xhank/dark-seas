import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import { defineComponentSystem, defineEnterSystem, EntityIndex, getComponentValueStrict, Has } from "@latticexyz/recs";
import { ActionType, Sprites } from "../../../../types";
import { getFiringArea, isBroadside, midpoint } from "../../../../utils/trig";
import { CANNON_SHOT_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createFireCannonAnimationSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Rotation, Length, Cannon, OwnedBy, Range },
      },
      backend: {
        components: { SelectedActions, ExecutedActions },
      },
    },
    scenes: {
      Main: { objectPool, config },
    },
    positions,
  } = phaser;

  const NUM_CANNONBALLS = 3;

  defineEnterSystem(world, [Has(Cannon), Has(OwnedBy), Has(Range), Has(Rotation)], ({ entity: cannonEntity }) => {
    const shipId = getComponentValueStrict(OwnedBy, cannonEntity).value;
    const shipEntity = world.entityToIndex.get(shipId);
    if (!shipEntity) return;

    const sprite = config.sprites[Sprites.Cannonball];

    for (let i = 0; i < NUM_CANNONBALLS; i++) {
      const { start } = getCannonStartAndEnd(shipEntity, cannonEntity, i);
      const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${i}`;
      const object = objectPool.get(spriteId, "Sprite");

      object.setComponent({
        id: `cannonball`,
        once: async (gameObject) => {
          gameObject.setAlpha(0);
          gameObject.setPosition(start.x, start.y);
          gameObject.setTexture(sprite.assetKey, sprite.frame);
          gameObject.setScale(4);
          gameObject.setDepth(RenderDepth.Foreground1);
          gameObject.setOrigin(0);
        },
      });
    }
  });

  defineComponentSystem(world, ExecutedActions, ({ entity: shipEntity, value }) => {
    value[0]?.specialEntities.forEach((cannonId, i) => {
      const cannonEntity = world.entityToIndex.get(cannonId);
      if (!cannonEntity) return;
      const action = value[0]?.actionTypes[i];
      if (action != ActionType.Fire) return;

      for (let i = 0; i < NUM_CANNONBALLS; i++) {
        const { start, end } = getCannonStartAndEnd(shipEntity, cannonEntity, i);

        const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${i}`;
        const delay = i * 200;
        const object = objectPool.get(spriteId, "Sprite");

        object.setComponent({
          id: `cannonball`,
          now: async (gameObject) => {
            await tween({
              targets: gameObject,
              delay,
              duration: 50,
              props: { alpha: 1 },
            });
            gameObject.setAlpha(1);
            await tween({
              targets: gameObject,
              duration: CANNON_SHOT_LENGTH,
              props: { x: end.x, y: end.y },
              ease: Phaser.Math.Easing.Quadratic.Out,
            });
          },
          once: async (gameObject) => {
            gameObject.setPosition(start.x, start.y);
            gameObject.setAlpha(0);
            // objectPool.remove(spriteId);
          },
        });
      }
    });
  });

  function getCannonStartAndEnd(
    shipEntity: EntityIndex,
    cannonEntity: EntityIndex,
    index: number
  ): { start: Coord; end: Coord } {
    const position = getComponentValueStrict(Position, shipEntity);
    const shipRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value;
    const range = getComponentValueStrict(Range, cannonEntity).value;
    const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;

    if (isBroadside(cannonRotation)) {
      const [bow, stern, sternCorner, bowCorner] = getFiringArea(
        position,
        range,
        length,
        shipRotation,
        cannonRotation
      ).map((coord) => tileCoordToPixelCoord(coord, positions.posWidth, positions.posHeight));

      const startCenter = midpoint(bow, stern);

      if (index == 0) {
        const bowStart = midpoint(bow, startCenter);
        return { start: bowStart, end: bowCorner };
      }
      if (index == 1) {
        return { start: startCenter, end: midpoint(sternCorner, bowCorner) };
      }
      const sternStart = midpoint(stern, startCenter);

      return { start: sternStart, end: sternCorner };
    }

    const [start, sternCorner, bowCorner] = getFiringArea(position, range, length, shipRotation, cannonRotation).map(
      (coord) => tileCoordToPixelCoord(coord, positions.posWidth, positions.posHeight)
    );

    if (index == 0) return { start, end: sternCorner };
    if (index == 1) return { start, end: bowCorner };
    return { start, end: midpoint(sternCorner, bowCorner) };
  }
}
