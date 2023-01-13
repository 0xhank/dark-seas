import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineSystem,
  EntityIndex,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
} from "@latticexyz/recs";
import { ActionType, Sprites } from "../../../../types";
import { getFiringArea, isBroadside, midpoint } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { CANNON_SHOT_LENGTH, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

export function createCannonAnimationSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Rotation, Length, Cannon, OwnedBy, Range, Ship },
      },
      backend: {
        components: { ExecutedActions },
        utils: { playSound },
      },
    },
    scenes: {
      Main: { objectPool, config },
    },
    positions,
  } = phaser;

  const NUM_CANNONBALLS = 3;

  defineEnterSystem(world, [Has(Cannon), Has(OwnedBy), Has(Rotation), Has(Range)], ({ entity: cannonEntity }) => {
    const shipId = getComponentValueStrict(OwnedBy, cannonEntity).value;
    const shipEntity = world.entityToIndex.get(shipId);
    if (!shipEntity) return;

    const sprite = config.sprites[Sprites.Cannonball];

    for (let i = 0; i < NUM_CANNONBALLS; i++) {
      const { start } = getCannonStartAndEnd(shipEntity, cannonEntity, i);
      const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${i}`;
      const object = objectPool.get(spriteId, "Sprite");

      object.setComponent({
        id: `texture`,
        once: async (gameObject) => {
          gameObject.setPosition(start.x, start.y);
          gameObject.setAlpha(0);
          gameObject.setTexture(sprite.assetKey, sprite.frame);
          gameObject.setScale(4);
          gameObject.setDepth(RenderDepth.Foreground1);
          gameObject.setOrigin(0);
        },
      });
    }
  });

  defineSystem(world, [Has(Position), Has(Ship)], ({ entity: shipEntity }) => {
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      for (let i = 0; i < NUM_CANNONBALLS; i++) {
        const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${i}`;
        const object = objectPool.get(spriteId, "Sprite");
        const { start } = getCannonStartAndEnd(shipEntity, cannonEntity, i);

        object.setComponent({
          id: "position",
          once: async (gameObject) => {
            gameObject.setPosition(start.x, start.y);
          },
        });
      }
    });
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
          id: `position`,
          now: async (gameObject) => {
            await tween({
              targets: gameObject,
              delay,
              duration: 50,
              props: { alpha: 1 },
            });
            playSound("cannon_shot", Category.Combat);
            gameObject.setAlpha(1);
            await tween({
              targets: gameObject,
              duration: CANNON_SHOT_LENGTH,
              props: { x: end.x, y: end.y },
              ease: Phaser.Math.Easing.Quadratic.Out,
            });
            playSound("impact_water_1", Category.Combat);
          },
          once: async (gameObject) => {
            gameObject.setPosition(start.x, start.y);
            gameObject.setAlpha(0);
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
