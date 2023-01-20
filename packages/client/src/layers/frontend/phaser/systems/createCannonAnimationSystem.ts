import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  defineEnterSystem,
  defineSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { distance } from "../../../../utils/distance";
import { getShipMidpoint } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { Animations, CANNON_SHOT_DELAY, CANNON_SPEED, RenderDepth } from "../constants";
import { PhaserLayer } from "../types";

type Attack = {
  target: EntityIndex;
  damage: number;
  onFire: boolean;
  damagedCannons: boolean;
  toreSail: boolean;
};
export function createCannonAnimationSystem(phaser: PhaserLayer) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Position, Rotation, Length, Cannon, OwnedBy, Range, Ship },
      },
      backend: {
        utils: { playSound },
        components: { ExecutedShots, LocalHealth, Targeted },
      },
    },
    scenes: {
      Main: { config, positions, phaserScene },
    },
    utils: { getSpriteObject, getGroupObject, destroySpriteObject, destroyGroupObject },
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
      const object = getSpriteObject(spriteId);

      object.setPosition(start.x, start.y);
      object.setAlpha(0);
      object.setTexture(sprite.assetKey, sprite.frame);
      object.setScale(4);
      object.setDepth(RenderDepth.Foreground1);
      object.setOrigin(0);
    }
  });

  defineSystem(world, [Has(Position), Has(Ship)], ({ entity: shipEntity }) => {
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];

    cannonEntities.forEach((cannonEntity) => {
      for (let i = 0; i < NUM_CANNONBALLS; i++) {
        const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${i}`;
        const object = getSpriteObject(spriteId);
        const start = getCannonStart(shipEntity);

        object.setPosition(start.x, start.y);
      }
    });
  });

  function decodeSpecialAttacks(encoding: number) {
    if (encoding == 0) return { onFire: false, damagedCannons: false, toreSail: false };
    const onFire = encoding % 2 == 1;
    const damagedCannons = Math.round(encoding / 10) % 2 == 1;
    const toreSail = Math.round(encoding / 100) % 2 == 1;
    return { onFire, damagedCannons, toreSail };
  }
  defineComponentSystem(world, ExecutedShots, ({ entity: cannonEntity, value }) => {
    const data = value[0];
    if (!data) return;
    const attacks = data.targets.map((target, i) => ({
      target: target as EntityIndex,
      damage: data.damage[i],
      ...decodeSpecialAttacks(data.specialDamage[i]),
    }));

    const shipEntity = world.getEntityIndexStrict(getComponentValueStrict(OwnedBy, cannonEntity).value);
    for (const attack of attacks) {
      for (let i = 0; i < NUM_CANNONBALLS; i++) {
        const hit = i < attack.damage;
        fireCannon(shipEntity, cannonEntity, attack, i, hit);
      }
    }
  });

  async function fireCannon(
    shipEntity: EntityIndex,
    cannonEntity: EntityIndex,
    attack: Attack,
    index: number,
    hit: boolean
  ) {
    const { start, end } = getCannonStartAndEnd(shipEntity, attack.target, index + 1, hit);

    const spriteId = `${shipEntity}-cannonball-${cannonEntity}-${index}`;
    const delay = index * CANNON_SHOT_DELAY;
    const object = getSpriteObject(spriteId);
    const targetedValue = getComponentValue(Targeted, attack.target)?.value || 1;
    setComponent(Targeted, attack.target, { value: targetedValue - 1 });
    await tween({
      targets: object,
      delay,
      duration: 50,
      props: { alpha: 1 },
    });
    playSound("cannon_shot", Category.Combat);
    object.setAlpha(1);

    const duration = CANNON_SPEED * distance(start, end);
    await tween({
      targets: object,
      duration,
      props: { x: end.x, y: end.y },
      ease: Phaser.Math.Easing.Linear,
    });

    if (hit) {
      const localHealth = getComponentValueStrict(LocalHealth, attack.target).value;
      setComponent(LocalHealth, attack.target, { value: localHealth - 1 });
      console.log("localhealth:", localHealth - 1);
      object.setAlpha(0);

      const explosionId = `explosion-${cannonEntity}-${index}`;
      const explosion = getSpriteObject(explosionId);
      explosion.setOrigin(0.5, 0.5);
      explosion.setPosition(end.x, end.y);
      explosion.setDepth(RenderDepth.UI5);
      playSound("impact_ship_1", Category.Combat);

      explosion.play(Animations.Explosion);

      explosion.on(`animationcomplete`, () => {
        destroySpriteObject(explosionId);
      });
    } else {
      playSound("impact_water_1", Category.Combat);

      tween({
        targets: object,
        duration: 250,
        props: { alpha: 0 },
      });
      const textId = `miss-text-${cannonEntity}-${index}`;
      const textGroup = getGroupObject(textId);
      const text = phaserScene.add.text(end.x, end.y, "MISS", {
        color: "white",
        fontSize: "64px",
        // fontStyle: "strong",
        fontFamily: "Inknut Antiqua, serif",
      });
      text.setDepth(RenderDepth.Foreground5);
      text.setOrigin(0.5);
      textGroup.add(text);
      await new Promise((resolve) => setTimeout(resolve, 500));
      destroyGroupObject(textId);
    }
    object.setPosition(start.x, start.y);
  }

  function getCannonStart(shipEntity: EntityIndex) {
    const attackerPosition = getComponentValueStrict(Position, shipEntity);
    const attackerRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const attackerLength = getComponentValueStrict(Length, shipEntity).value;
    const attackerMidpoint = getShipMidpoint(attackerPosition, attackerRotation, attackerLength);
    return tileCoordToPixelCoord(attackerMidpoint, positions.posWidth, positions.posHeight);
  }
  function getCannonStartAndEnd(
    shipEntity: EntityIndex,
    targetEntity: EntityIndex,
    shotNumber: number,
    hit: boolean
  ): { start: Coord; end: Coord } {
    const targetPosition = getComponentValueStrict(Position, targetEntity);
    const targetRotation = getComponentValueStrict(Rotation, targetEntity).value;
    const targetLength = getComponentValueStrict(Length, targetEntity).value;

    const targetMidpoint = getShipMidpoint(targetPosition, targetRotation, (targetLength * shotNumber) / 2);
    const startCenter = getCannonStart(shipEntity);
    const endCenter = tileCoordToPixelCoord(targetMidpoint, positions.posWidth, positions.posHeight);

    if (hit) return { start: startCenter, end: endCenter };
    const missDistance = (targetLength * positions.posHeight) / 2;
    const missArea = 40;
    const randX = Math.round(Math.random() * missArea + missDistance);
    const randY = Math.round(Math.random() * missArea + missDistance);
    return {
      start: startCenter,
      end: { x: endCenter.x + (randX % 2 == 1 ? randX : -randX), y: endCenter.y + (randY % 2 == 1 ? randY : -randY) },
    };
  }
}
