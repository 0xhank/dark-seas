import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import {
  ComponentValue,
  defineRxSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { BigNumber, utils } from "ethers";
import { BytesLike, defaultAbiCoder as abi } from "ethers/lib/utils";
import { ActionStruct } from "../../../contracts/types/ethers-contracts/ActionSystem";
import {
  Animations,
  CANNON_SHOT_DELAY,
  CANNON_SPEED,
  POS_HEIGHT,
  POS_WIDTH,
  RenderDepth,
  SHIP_RATIO,
} from "../phaser/constants";
import { Category } from "../sound";
import { ActionHashes, ActionType, SetupResult, Sprites } from "../types";
import { distance } from "../utils/distance";
import { getMidpoint, midpoint } from "../utils/trig";

export function createSuccessfulActionSystem(MUD: SetupResult) {
  const {
    world,
    components: {
      ExecutedCannon,
      ExecutedActions,
      HealthLocal,
      OnFireLocal,
      SailPositionLocal,
      DamagedCannonsLocal,
      SelectedShip,
      HealthBackend,
      SelectedActions,
      HoveredAction,
    },
    utils: { isMyShip, clearComponent, bigNumToEntityID },
    systemCallStreams,
    scene: { config, phaserScene },
    components: { Position, Rotation, Length, OwnedBy, Targeted },
    utils: { getFiringAreaPixels, getSpriteObject, getGroupObject, destroySpriteObject, destroyGroupObject, playSound },
  } = MUD;

  function parseLoadAction(action: BytesLike) {
    const [cannonEntity] = abi.decode(["uint256"], action);
    return world.entityToIndex.get(bigNumToEntityID(cannonEntity));
  }

  function parseShotAction(action: BytesLike): { cannonEntity: EntityIndex | undefined; targets: EntityIndex[] } {
    const [cannonID, targetIDs] = abi.decode(["uint256", "uint256[]"], action);
    const cannonEntity = world.entityToIndex.get(bigNumToEntityID(cannonID));
    const targets = targetIDs.reduce((targetArr: EntityIndex[], curr: BigNumber) => {
      const entityIndex = world.entityToIndex.get(bigNumToEntityID(curr));
      if (!entityIndex) return targetArr;
      return [...targetArr, entityIndex];
    }, []);

    return { cannonEntity, targets };
  }

  defineRxSystem(world, systemCallStreams["ds.system.Action"], (systemCall) => {
    const { args, systemId, updates } = systemCall;
    const { actions: rawActions } = args as {
      actions: ActionStruct[];
    };

    const shipUpdates: Map<string, ComponentValue> = new Map();
    updates.forEach((update) => {
      const entity = update.entity;

      const component = update.component;
      const key = `${entity}-${component.id}`;
      if (update.value == undefined) return;
      shipUpdates.set(key, update.value);
    });

    // iterate through ships
    rawActions.forEach((action) => {
      const shipEntity = world.entityToIndex.get(bigNumToEntityID(action.shipEntity));
      if (!shipEntity) return;
      if (isMyShip(shipEntity)) {
        clearComponent(SelectedShip);
        clearComponent(SelectedActions);
        clearComponent(HoveredAction);
      }
      // iterate through ship actions

      const executedActions = action.actions.map((a, i) => {
        const actionTypeStr = Object.keys(ActionHashes).find(
          (key) => ActionHashes[Number(key) as ActionType] == utils.toUtf8String(a)
        );
        if (!actionTypeStr) return ActionType.None;
        const actionType = Number(actionTypeStr);
        completeAction(shipEntity, actionType, action.metadata[i], shipUpdates);
        return actionType;
      });
      setComponent(ExecutedActions, shipEntity, { value: executedActions });
      //TODO: animate this

      const shipNewHealth = shipUpdates.get(`${shipEntity}-Health`)?.value as number | undefined;
      if (shipNewHealth !== undefined) {
        setComponent(HealthLocal, shipEntity, { value: shipNewHealth });
        setComponent(HealthBackend, shipEntity, { value: shipNewHealth });
      }
    });
  });

  function completeAction(
    shipEntity: EntityIndex,
    actionType: number,
    metadata: BytesLike,
    shipUpdates: Map<string, ComponentValue>
  ) {
    if (actionType == ActionType.Load) {
      const cannonEntity = parseLoadAction(metadata);
      if (!cannonEntity) return;
      setComponent(ExecutedCannon, cannonEntity, { value: true });
    } else if (actionType == ActionType.Fire) {
      const { cannonEntity, targets } = parseShotAction(metadata);
      if (!cannonEntity) return;
      fireCannons(cannonEntity, makeAttacks(targets, shipUpdates));
      setComponent(ExecutedCannon, cannonEntity, { value: true });
    } else if (actionType == ActionType.ExtinguishFire) {
      const newOnFire = shipUpdates.get(`${shipEntity}-OnFire`)?.value as number | undefined;
      setComponent(OnFireLocal, shipEntity, { value: newOnFire || 0 });
    } else if ([ActionType.LowerSail, ActionType.RaiseSail, ActionType.RepairSail].includes(actionType)) {
      const newSail = shipUpdates.get(`${shipEntity}-SailPosition`)?.value as number | undefined;
      setComponent(SailPositionLocal, shipEntity, { value: newSail || 0 });
    } else if (actionType == ActionType.RepairCannons) {
      const newCannons = shipUpdates.get(`${shipEntity}-DamagedCannons`)?.value as number | undefined;
      setComponent(DamagedCannonsLocal, shipEntity, { value: newCannons || 0 });
    }
  }

  function makeAttacks(targets: EntityIndex[], shipUpdates: Map<string, ComponentValue>) {
    const attacks: Attack[] = [];
    targets.forEach((target) => {
      const healthKey = `${target}-Health`;
      const oldHealth = getComponentValueStrict(HealthBackend, target).value;
      const newHealth = shipUpdates.get(healthKey)?.value as number | undefined;
      const healthToUpdate = newHealth == undefined ? oldHealth : newHealth;
      const damage = Math.min(3, oldHealth - healthToUpdate);
      setComponent(HealthBackend, target, { value: oldHealth - damage });

      const fireKey = `${target}-OnFire`;
      const damagedCannonsKey = `${target}-DamagedCannons`;
      const sailPositionKey = `${target}-SailPosition`;
      attacks.push({
        target,
        damage: damage,
        onFire: !!shipUpdates.get(fireKey),
        damagedCannons: !!shipUpdates.get(damagedCannonsKey),
        tornSail: !!shipUpdates.get(sailPositionKey),
      });
    });
    return attacks;
  }

  type Attack = {
    target: EntityIndex;
    damage: number;
    onFire?: boolean;
    damagedCannons?: boolean;
    tornSail?: boolean;
  };
  function fireCannons(cannonEntity: EntityIndex, attacks: Attack[]) {
    const shipEntity = world.getEntityIndexStrict(getComponentValueStrict(OwnedBy, cannonEntity).value);
    const NUM_CANNONBALLS = 3;

    const start = getShipMidpoint(shipEntity);

    if (attacks.length == 0) {
      const position = getComponentValueStrict(Position, shipEntity);
      const rotation = getComponentValue(Rotation, shipEntity)?.value || 0;
      const length = getComponentValue(Length, shipEntity)?.value || 10;
      const firingArea = getFiringAreaPixels(position, rotation, length, cannonEntity);

      for (let i = 0; i < 3; i++) {
        fireAtNobody(start, cannonEntity, firingArea, i);
      }
      return;
    }

    attacks.forEach((attack, i) => {
      for (let j = 0; j < NUM_CANNONBALLS; j++) {
        fireCannon(start, cannonEntity, attack, i * NUM_CANNONBALLS + j, j < attack.damage);
      }
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

    async function fireCannon(
      start: Coord,
      cannonEntity: EntityIndex,
      attack: Attack,
      shotIndex: number,
      hit: boolean
    ) {
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
        if (attack.tornSail) setComponent(SailPositionLocal, attack.target, { value: 0 });

        const explosionId = `explosion-${cannonEntity}-${shotIndex}`;
        explode(explosionId, end);

        const healthLocal = getComponentValueStrict(HealthLocal, attack.target).value;
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
}
