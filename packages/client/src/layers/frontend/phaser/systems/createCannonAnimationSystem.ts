import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { distance } from "../../../../utils/distance";
import { getMidpoint } from "../../../../utils/trig";
import { Category } from "../../../backend/sound/library";
import { Animations, CANNON_SHOT_DELAY, CANNON_SPEED, RenderDepth, SHIP_RATIO } from "../constants";
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
    scene: { config, posHeight, phaserScene, posWidth },
    components: {
      Position,
      Rotation,
      Length,
      OwnedBy,
      ExecutedShots,
      HealthLocal,
      Targeted,
      OnFireLocal,
      DamagedCannonsLocal,
      SailPositionLocal,
    },
    utils: { getSpriteObject, getGroupObject, destroySpriteObject, destroyGroupObject, playSound },
  } = phaser;

  const NUM_CANNONBALLS = 3;

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

    const start = getShipMidpoint(shipEntity);
    attacks.forEach((attack, i) => {
      for (let j = 0; j < NUM_CANNONBALLS; j++) {
        fireCannon(start, cannonEntity, attack, i * NUM_CANNONBALLS + j, j < attack.damage);
      }
    });
  });

  async function fireCannon(start: Coord, cannonEntity: EntityIndex, attack: Attack, shotIndex: number, hit: boolean) {
    const end = getCannonEnd(attack.target, hit);

    const targetedValue = getComponentValue(Targeted, attack.target)?.value;
    if (targetedValue) removeComponent(Targeted, attack.target);

    const spriteId = `cannonball-${cannonEntity}-${shotIndex}`;

    const delay = shotIndex * CANNON_SHOT_DELAY;
    const object = getSpriteObject(spriteId);
    object.setAlpha(0);
    object.setPosition(start.x, start.y);

    const sprite = config.sprites[Sprites.Cannonball];
    object.setTexture(sprite.assetKey, sprite.frame);
    object.setScale(4);
    object.setDepth(RenderDepth.Foreground1);
    object.setOrigin(0);
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
      const healthLocal = getComponentValueStrict(HealthLocal, attack.target).value;
      setComponent(HealthLocal, attack.target, { value: healthLocal - 1 });
      object.setAlpha(0);

      if (attack.onFire) setComponent(OnFireLocal, attack.target, { value: 1 });
      if (attack.damagedCannons) setComponent(DamagedCannonsLocal, attack.target, { value: 2 });
      if (attack.toreSail) setComponent(SailPositionLocal, attack.target, { value: 0 });

      const explosionId = `explosion-${cannonEntity}-${shotIndex}`;
      const explosion = getSpriteObject(explosionId);
      explosion.setOrigin(0.5, 0.5);
      explosion.setPosition(end.x, end.y);
      explosion.setDepth(RenderDepth.UI5);
      playSound("impact_ship_1", Category.Combat);

      explosion.play(Animations.Explosion);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      destroySpriteObject(explosionId);
    } else {
      playSound("impact_water_1", Category.Combat);

      tween({
        targets: object,
        duration: 250,
        props: { alpha: 0 },
      });
      const textId = `miss-text-${cannonEntity}-${shotIndex}`;
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
    destroySpriteObject(spriteId);
  }

  function getShipMidpoint(shipEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
    const length = getComponentValue(Length, shipEntity)?.value || 10;
    const midpoint = getMidpoint(position, rotation, length);

    return tileCoordToPixelCoord(midpoint, posWidth, posHeight);
  }
  function getCannonEnd(targetEntity: EntityIndex, hit: boolean): Coord {
    const targetCenter = getShipMidpoint(targetEntity);
    const length = getComponentValueStrict(Length, targetEntity).value;
    const targetWidth = length / (1.5 * SHIP_RATIO);

    if (hit) {
      const randX = Math.random() * targetWidth * 2 - targetWidth;
      const randY = Math.random() * targetWidth * 2 - targetWidth;
      return { x: targetCenter.x + randX * posHeight, y: targetCenter.y + randY * posHeight };
    }

    const missDistance = (length * posHeight) / 2;
    const missArea = 40;
    const randX = Math.round(Math.random() * missArea + missDistance);
    const randY = Math.round(Math.random() * missArea + missDistance);
    return {
      x: targetCenter.x + (randX % 2 == 1 ? randX : -randX),
      y: targetCenter.y + (randY % 2 == 1 ? randY : -randY),
    };
  }
}
