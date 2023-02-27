import { Coord, tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  ComponentValue,
  defineComponentSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
  Type,
} from "@latticexyz/recs";
import {
  Animations,
  CANNON_SHOT_DELAY,
  CANNON_SPEED,
  POS_HEIGHT,
  POS_WIDTH,
  RenderDepth,
  SHIP_RATIO,
} from "../../phaser/constants";
import { SetupResult } from "../../setupMUD";
import { Category } from "../../sound";
import { Sprites } from "../../types";
import { distance } from "../../utils/distance";
import { getMidpoint, midpoint } from "../../utils/trig";

type Attack = {
  target: EntityIndex;
  damage: number;
  onFire: boolean;
  damagedCannons: boolean;
  toreSail: boolean;
};
export function cannonFireSystems(MUD: SetupResult) {
  const {
    world,
    scene: { config, phaserScene },
    components: {
      Position,
      Rotation,
      Length,
      OwnedBy,
      ExecutedShots,
      HealthLocal,
      HealthBackend,
      Targeted,
      OnFireLocal,
      DamagedCannonsLocal,
      SailPositionLocal,
    },
    utils: { getFiringAreaPixels, getSpriteObject, getGroupObject, destroySpriteObject, destroyGroupObject, playSound },
  } = MUD;

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
    const shipEntity = world.getEntityIndexStrict(getComponentValueStrict(OwnedBy, cannonEntity).value);

    const start = getShipMidpoint(shipEntity);

    if (data.targets.length == 0) {
      const position = getComponentValueStrict(Position, shipEntity);
      const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
      const length = getComponentValue(Length, shipEntity)?.value || 10;
      const firingArea = getFiringAreaPixels(position, rotation, length, cannonEntity);

      for (let i = 0; i < 3; i++) {
        fireAtNobody(start, cannonEntity, firingArea, i);
      }
      return;
    }

    const attacks = data.targets.map((target, i) => ({
      target: target as EntityIndex,
      damage: data.damage[i],
      ...decodeSpecialAttacks(data.specialDamage[i]),
    }));

    attacks.forEach((attack, i) => {
      for (let j = 0; j < NUM_CANNONBALLS; j++) {
        fireCannon(start, cannonEntity, attack, i * NUM_CANNONBALLS + j, j < attack.damage);
      }
    });
  });

  async function fireAtNobody(start: Coord, cannonEntity: EntityIndex, firingArea: Coord[], shotIndex: number) {
    let end = midpoint(firingArea[1], firingArea[2]);
    if (firingArea.length == 4) {
      end = midpoint(firingArea[2], firingArea[3]);
    }
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
    destroySpriteObject(spriteId);
  }

  async function fireCannon(start: Coord, cannonEntity: EntityIndex, attack: Attack, shotIndex: number, hit: boolean) {
    const oldHealth = getComponentValueStrict(HealthBackend, attack.target).value;
    setComponent(HealthBackend, attack.target, { value: oldHealth - attack.damage });

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
      object.setAlpha(0);

      if (attack.onFire) setComponent(OnFireLocal, attack.target, { value: 1 });
      if (attack.damagedCannons) setComponent(DamagedCannonsLocal, attack.target, { value: 2 });
      if (attack.toreSail) setComponent(SailPositionLocal, attack.target, { value: 0 });

      const explosionId = `explosion-${cannonEntity}-${shotIndex}`;
      explode(explosionId, end);

      const healthLocal = getComponentValueStrict(HealthLocal, attack.target).value;
      if (healthLocal == 1) playDeathAnimation(attack.target);
      setComponent(HealthLocal, attack.target, { value: healthLocal - 1 });
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
    const backendHealth = getComponentValueStrict(HealthBackend, attack.target).value;
    if (backendHealth != getComponentValueStrict(HealthLocal, attack.target).value) {
      setComponent(HealthLocal, attack.target, { value: backendHealth });
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

  function getShipMidpoint(shipEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
    const length = getComponentValue(Length, shipEntity)?.value || 10;
    const midpoint = getMidpoint(position, rotation, length);

    return tileCoordToPixelCoord(midpoint, POS_WIDTH, POS_HEIGHT);
  }
  function getCannonEnd(targetEntity: EntityIndex, hit: boolean): Coord {
    const targetCenter = getShipMidpoint(targetEntity);
    const length = getComponentValueStrict(Length, targetEntity).value;
    const targetWidth = length / (1.5 * SHIP_RATIO);

    if (hit) {
      const randX = Math.random() * targetWidth * 2 - targetWidth;
      const randY = Math.random() * targetWidth * 2 - targetWidth;
      return { x: targetCenter.x + randX * POS_HEIGHT, y: targetCenter.y + randY * POS_HEIGHT };
    }

    const missDistance = (length * POS_HEIGHT) / 2;
    const missArea = 40;
    const randX = Math.round(Math.random() * missArea + missDistance);
    const randY = Math.round(Math.random() * missArea + missDistance);
    return {
      x: targetCenter.x + (randX % 2 == 1 ? randX : -randX),
      y: targetCenter.y + (randY % 2 == 1 ? randY : -randY),
    };
  }
}
function getFiringAreaPixels(
  phaser: any,
  position: ComponentValue<{ x: Type.Number; y: Type.Number }, undefined>,
  rotation: number,
  length: number,
  cannonEntity: EntityIndex
) {
  throw new Error("Function not implemented.");
}
