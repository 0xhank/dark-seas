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
import { Sprites } from "../../../../types";
import { getSternLocation, midpoint } from "../../../../utils/trig";
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
        utils: { playSound },
        components: { ExecutedShots },
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
      const start = getCannonStart(shipEntity);
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
        const start = getCannonStart(shipEntity);

        object.setComponent({
          id: "position",
          once: async (gameObject) => {
            gameObject.setPosition(start.x, start.y);
          },
        });
      }
    });
  });

  defineComponentSystem(world, ExecutedShots, ({ entity: cannonEntity, value }) => {
    const data = value[0];
    if (!data) return;

    const attacks = data.targets.map((target, i) => ({ target: target as EntityIndex, damage: data.damage[i] }));
    const shipEntity = world.getEntityIndexStrict(getComponentValueStrict(OwnedBy, cannonEntity).value);
    for (const attack of attacks) {
      for (let i = 0; i < NUM_CANNONBALLS; i++) {
        const hit = i + 1 < attack.damage;
        const { start, end } = getCannonStartAndEnd(shipEntity, cannonEntity, attack.target, hit);

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
            console.log(`firing cannonball ${i}`);

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
    }
  });

  function getCannonStart(shipEntity: EntityIndex) {
    const attackerPosition = getComponentValueStrict(Position, shipEntity);
    const attackerRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const attackerLength = getComponentValueStrict(Length, shipEntity).value;
    const attackerStern = getSternLocation(attackerPosition, attackerRotation, attackerLength);
    return tileCoordToPixelCoord(midpoint(attackerPosition, attackerStern), positions.posWidth, positions.posHeight);
  }
  function getCannonStartAndEnd(
    shipEntity: EntityIndex,
    cannonEntity: EntityIndex,
    targetEntity: EntityIndex,
    hit: boolean
  ): { start: Coord; end: Coord } {
    const targetPosition = getComponentValueStrict(Position, targetEntity);
    const targetRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const targetLength = getComponentValueStrict(Length, shipEntity).value;
    const targetStern = getSternLocation(targetPosition, targetRotation, targetLength);
    const startCenter = getCannonStart(shipEntity);
    const endCenter = tileCoordToPixelCoord(
      midpoint(targetPosition, targetStern),
      positions.posWidth,
      positions.posHeight
    );

    if (hit) return { start: startCenter, end: endCenter };

    return { start: startCenter, end: { x: endCenter.x + 20, y: endCenter.y + 20 } };
  }
}
