import { Clock } from "@latticexyz/network";
import { createPerlin } from "@latticexyz/noise";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  Component,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  NotValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";

import { Coord } from "@latticexyz/utils";
import { BigNumber, BigNumberish } from "ethers";
import { Howl } from "howler";
import { sprites } from "../phaser/config";
import { MOVE_LENGTH, POS_HEIGHT, POS_WIDTH, RenderDepth, SHIP_RATIO } from "../phaser/constants";
import { colors } from "../react/styles/global";
import { Category, soundLibrary } from "../sound";
import { getRangeTintAlpha } from "../systems/phaser/renderShip";
import { Action, ActionType, DELAY, Move, Phase, ShipPrototype, Sprites } from "../types";
import { distance } from "../utils/distance";
import { cap, getHash, getShipSprite } from "../utils/ships";
import {
  getFiringArea,
  getPolygonCenter,
  getPositionByVector,
  getSternPosition,
  inFiringArea,
  isBroadside,
} from "../utils/trig";
import { adjectives, nouns } from "../wordlist";
import { clientComponents, components } from "./components";
import { polygonRegistry, spriteRegistry, world } from "./world";
export async function createUtilities(
  godEntity: EntityIndex,
  playerAddress: string,
  clock: Clock,
  mainScene: Phaser.Scene
) {
  const perlin = await createPerlin();

  function bigNumToEntityID(bigNum: BigNumberish): EntityID {
    return BigNumber.from(bigNum).toHexString() as EntityID;
  }

  const getGameConfig = () => {
    return getComponentValue(components.GameConfig, godEntity);
  };

  function getPlayerEntity(address?: string): EntityIndex | undefined {
    if (!address) address = playerAddress;
    const playerEntity = world.entityToIndex.get(address as EntityID);
    return playerEntity;
  }

  function pixelCoord(coord: Coord) {
    return tileCoordToPixelCoord(coord, POS_HEIGHT, POS_WIDTH);
  }

  function getPhase(timeMs: number, delay = true): Phase | undefined {
    const delayMs = delay ? DELAY : 0;
    const gamePhase = getGamePhaseAt((timeMs + delayMs) / 1000);
    return gamePhase;
  }

  function getGamePhaseAt(timeInSeconds: number): Phase | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const gameLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    const secondsIntoTurn = timeElapsed % gameLength;

    if (secondsIntoTurn < gameConfig.commitPhaseLength) return Phase.Commit;
    if (secondsIntoTurn < gameConfig.commitPhaseLength + gameConfig.revealPhaseLength) return Phase.Reveal;
    return Phase.Action;
  }

  function getTurn(timeMs: number, delay = true): number | undefined {
    const delayMs = delay ? DELAY : 0;
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = Math.floor((timeMs + delayMs) / 1000) - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    return Math.floor(timeElapsed / turnLength);
  }

  function secondsIntoTurn(timeMs: number, delay = true) {
    const delayMs = delay ? DELAY : 0;
    const gameConfig = getGameConfig();
    const phase = getPhase(timeMs, delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor((clock.currentTime + delayMs) / 1000) - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    return gameLength % turnLength;
  }

  function secondsUntilNextPhase(timeMs: number, delay = true) {
    const gameConfig = getGameConfig();
    const phase = getPhase(timeMs, delay);

    if (!gameConfig || phase == undefined) return;

    const delayMs = delay ? DELAY : 0;
    const gameLength = Math.floor((clock.currentTime + delayMs) / 1000) - parseInt(gameConfig.startTime);

    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    const secondsIntoTurn = gameLength % turnLength;

    const phaseEnd =
      phase == Phase.Commit
        ? gameConfig.commitPhaseLength
        : phase == Phase.Reveal
        ? gameConfig.commitPhaseLength + gameConfig.revealPhaseLength
        : turnLength;
    return phaseEnd - secondsIntoTurn;
  }

  function getWorldHeightAtTime(timeMs: number, delay = true): number {
    const turn = getTurn(timeMs, false);
    const gameConfig = getGameConfig();
    if (!gameConfig || turn == undefined) return 0;
    if (turn <= gameConfig.entryCutoffTurns || gameConfig.shrinkRate == 0) return gameConfig.worldSize;
    const turnsAfterCutoff = turn - gameConfig.entryCutoffTurns;
    const finalSize = gameConfig.worldSize - (gameConfig.shrinkRate / 100) * turnsAfterCutoff;

    return finalSize < 50 ? 50 : Math.ceil(finalSize);
  }

  function getWorldDimsAtTime(timeMs: number, delay = true) {
    const height = getWorldHeightAtTime(timeMs, delay);

    return { height, width: (height * 16) / 9 };
  }

  function inWorld(timeMs: number, a: Coord, delay = true): boolean {
    const turn = getTurn(timeMs, delay);
    if (turn == undefined) return false;
    const dims = getWorldDimsAtTime(turn);

    return Math.abs(a.x) <= dims.width && Math.abs(a.y) <= dims.height;
  }

  function outOfBounds(timeMs: number, position: Coord) {
    const gameConfig = getGameConfig();
    if (!gameConfig) return false;

    if (!inWorld(timeMs, position)) return true;

    const whirlpool = isWhirlpool(position, Number(gameConfig.perlinSeed));
    if (whirlpool) return true;
    return false;
  }

  function clearComponent(component: Component) {
    [...component.entities()].forEach((entity) => removeComponent(component, entity));
  }

  function isMyShip(shipEntity: EntityIndex): boolean {
    const owner = getComponentValue(components.OwnedBy, shipEntity)?.value;
    if (!owner) return false;
    return owner == playerAddress;
  }

  function getShipOwner(shipEntity: EntityIndex) {
    const owner = getComponentValue(components.OwnedBy, shipEntity)?.value;
    if (!owner) return;
    return world.entityToIndex.get(owner);
  }

  function checkActionPossible(action: ActionType, ship: EntityIndex): boolean {
    if (isNaN(action)) return false;
    if (action == ActionType.None) return false;
    if (action == ActionType.Fire) return false;
    if (action == ActionType.Load) return false;
    if (action == ActionType.ExtinguishFire && !getComponentValue(clientComponents.OnFireLocal, ship)?.value)
      return false;

    if (action == ActionType.RepairCannons && !getComponentValue(clientComponents.DamagedCannonsLocal, ship)?.value)
      return false;

    const sailPosition = getComponentValueStrict(clientComponents.SailPositionLocal, ship).value;
    if (action == ActionType.LowerSail && sailPosition != 2) return false;
    if (action == ActionType.RaiseSail && sailPosition != 1) return false;
    if (action == ActionType.RepairSail && sailPosition > 0) return false;

    return true;
  }

  const prototypeRegistry = new Map<EntityIndex, ShipPrototype>();

  function decodeShipPrototype(prototypeEntity: EntityIndex) {
    const retrieved = prototypeRegistry.get(prototypeEntity);
    if (retrieved) return retrieved;
    const shipPrototypeDataEncoded = getComponentValueStrict(components.ShipPrototype, prototypeEntity).value;

    const reformattedData = "0x" + shipPrototypeDataEncoded.slice(66);

    const [price, length, maxHealth, speed, rawCannons, name] = abi.decode(
      [
        "uint32 price",
        "uint32 length",
        "uint32 maxHealth",
        "uint32 speed",
        "tuple(uint32 rotation,uint32 firepower,uint32 range)[] cannons",
        "string name",
      ],
      reformattedData
    );

    const prototype: ShipPrototype = {
      maxHealth,
      speed,
      cannons: rawCannons,
      price,
      length,
      name,
    };
    prototypeRegistry.set(prototypeEntity, prototype);
    return prototype;
  }

  function getPlayerShips(player?: EntityIndex) {
    if (!player) player = getPlayerEntity();
    if (!player) return [];
    const ships = [
      ...runQuery([Has(components.Ship), HasValue(components.OwnedBy, { value: world.entities[player] })]),
    ];

    return ships;
  }
  function getPlayerShipsWithMoves(player?: EntityIndex): Move[] | undefined {
    if (!player) player = getPlayerEntity();
    if (!player) return;
    const ships = [
      ...runQuery([
        HasValue(components.OwnedBy, { value: world.entities[player] }),
        Has(clientComponents.SelectedMove),
      ]),
    ];
    if (ships.length == 0) return;
    const moves = ships.map((ship) => {
      const move = getComponentValueStrict(clientComponents.SelectedMove, ship).value as EntityIndex;
      return {
        shipEntity: world.entities[ship],
        moveCardEntity: world.entities[move],
      };
    });
    return moves;
  }

  function getTargetedShips(cannonEntity: EntityIndex): EntityIndex[] {
    const shipID = getComponentValue(components.OwnedBy, cannonEntity)?.value;
    const playerEntity = getPlayerEntity();
    if (!shipID || !playerEntity) return [];
    const shipEntity = world.entityToIndex.get(shipID);

    if (!shipEntity) return [];

    const length = getComponentValueStrict(components.Length, shipEntity).value;
    const shipPosition = getComponentValueStrict(components.Position, shipEntity);
    const shipRotation = getComponentValueStrict(components.Rotation, shipEntity).value;
    const cannonRotation = getComponentValueStrict(components.Rotation, cannonEntity).value;
    const playerEntityID = world.entities[playerEntity];
    const shipEntities = [
      ...runQuery([Has(components.Ship), NotValue(components.OwnedBy, { value: playerEntityID })]),
    ].filter((targetEntity) => {
      if (targetEntity == shipEntity) return false;
      if (getComponentValue(clientComponents.HealthLocal, targetEntity)?.value == 0) return false;

      const enemyPosition = getComponentValueStrict(components.Position, targetEntity);
      const enemyRotation = getComponentValueStrict(components.Rotation, targetEntity).value;
      const enemyLength = getComponentValueStrict(components.Length, targetEntity).value;
      const sternPosition = getSternPosition(enemyPosition, enemyRotation, enemyLength);
      const range = getCannonRange(cannonEntity);
      const firingArea = getFiringArea(shipPosition, range, length, shipRotation, cannonRotation);

      return inFiringArea({ p1: enemyPosition, p2: sternPosition }, firingArea);
    });

    return shipEntities;
  }

  function getBaseHitChance(distance: number, firepower: number) {
    return (50 * Math.exp(-0.008 * distance) * firepower) / 100;
  }

  function getDamageLikelihood(cannonEntity: EntityIndex, target: EntityIndex) {
    const shipID = getComponentValue(components.OwnedBy, cannonEntity)?.value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;

    const shipPosition = getComponentValueStrict(components.Position, shipEntity);
    const targetPosition = getComponentValueStrict(components.Position, target);
    const dist = distance(shipPosition, targetPosition);

    const firepower = getCannonFirepower(cannonEntity);
    const kills = getComponentValueStrict(components.Kills, shipEntity).value;
    const baseHitChance = getBaseHitChance(dist, firepower * (1 + kills / 10));

    const format = (n: number) => Math.min(100, Math.round(n));
    return { 3: format(baseHitChance), 2: format(baseHitChance * 1.7), 1: format(baseHitChance * 6.5) };
  }

  function getPlayerShipsWithActions(player?: EntityIndex): Action[] {
    if (!player) player = getPlayerEntity();
    if (!player) return [];
    const ships = [
      ...runQuery([
        HasValue(components.OwnedBy, { value: world.entities[player] }),
        Has(clientComponents.SelectedActions),
      ]),
    ];
    if (ships.length == 0) return [];

    return ships.reduce((prevActions: Action[], ship: EntityIndex) => {
      const actions = getComponentValueStrict(clientComponents.SelectedActions, ship);
      const actionTypes = actions.actionTypes;
      if (actionTypes.length == 0) return prevActions;
      if (actionTypes.every((actionType) => actionType == ActionType.None)) return prevActions;

      const specialEntities = actions.specialEntities;
      const finalActions: [ActionType, ActionType] = [ActionType.None, ActionType.None];
      const finalSpecials: [EntityID, EntityID] = ["0" as EntityID, "0" as EntityID];

      actionTypes.forEach((val, idx) => {
        if (idx > 1) return;
        finalActions[idx] = val;
        finalSpecials[idx] = specialEntities[idx];
      });

      return [
        ...prevActions,
        {
          shipEntity: world.entities[ship],
          actionTypes: finalActions,
          specialEntities: finalSpecials,
        },
      ];
    }, []);
  }

  function getCannonOwner(cannonEntity: EntityIndex) {
    const shipID = getComponentValue(components.OwnedBy, cannonEntity)?.value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;
    return shipEntity;
  }

  function getCannonRange(cannonEntity: EntityIndex) {
    const range = getComponentValue(components.Range, cannonEntity)?.value;
    const shipEntity = getCannonOwner(cannonEntity);
    if (!shipEntity) return 0;
    const kills = getComponentValue(components.Kills, shipEntity)?.value;
    const boost = kills ? 1 + kills / 10 : 1;
    if (range == undefined) return 0;

    return range * boost;
  }

  function getCannonFirepower(cannonEntity: EntityIndex) {
    const firepower = getComponentValue(components.Firepower, cannonEntity)?.value;
    const shipEntity = getCannonOwner(cannonEntity);
    if (!shipEntity) return 0;
    const kills = getComponentValue(components.Kills, shipEntity)?.value;
    if (firepower == undefined || kills == undefined) return 0;

    return firepower * (1 + kills / 10);
  }

  const whirlpoolMap = new Map<string, boolean>();

  function isWhirlpool(coord: Coord, perlinSeed: number): boolean {
    const coordStr = `${coord.x}-${coord.y}`;
    const retrievedVal = whirlpoolMap.get(coordStr);

    if (retrievedVal != undefined) return retrievedVal;
    const denom = 50;
    const depth = perlin(coord.x + perlinSeed, coord.y + perlinSeed, 0, denom);
    const ret = depth * 100 < 35;
    whirlpoolMap.set(coordStr, ret);

    return ret;
  }

  const soundRegistry = new Map<string, Howl>();
  const musicRegistry = new Map<string, Howl>();

  function playSound(id: string, category: Category, loop = false, fade?: number) {
    const volume = getComponentValueStrict(clientComponents.Volume, godEntity).value;
    const sound = new Howl({
      src: [soundLibrary[category][id].src],
      volume: soundLibrary[category][id].volume * volume,
      preload: true,
      loop: loop,
    });
    if (fade) {
      // Fade on begin and end

      // Init
      sound.play();
      sound.fade(0, 0.4, fade);
    } else {
      sound.play();
    }
    soundRegistry.set(id, sound);
    return sound;
  }

  function unmuteSfx() {
    setComponent(clientComponents.Volume, godEntity, { value: 1 });
    localStorage.setItem("volume", "1");
    playSound("ocean", Category.Ambience, true);
  }
  function muteSfx() {
    [...soundRegistry.values()].forEach((entry) => {
      entry.pause();
    });
    setComponent(clientComponents.Volume, godEntity, { value: 0 });
    localStorage.setItem("volume", "0");
  }

  function startEnvironmentSoundSystem() {
    const volumeStr = localStorage.getItem("volume");
    const volume = volumeStr ? Number(volumeStr) : 1;
    setComponent(clientComponents.Volume, godEntity, { value: volume });

    playSound("ocean", Category.Ambience, true);
  }

  function playMusic(vol?: number) {
    if (vol !== undefined) {
      localStorage.setItem("music-volume", `${vol}`);
    }
    const volumeStr = localStorage.getItem("music-volume");
    const volume = vol || volumeStr ? Number(volumeStr) : 1;
    setComponent(clientComponents.Volume, 1 as EntityIndex, { value: volume });

    const music = new Howl({
      src: [soundLibrary[Category.Music]["sailing"].src],
      volume: volume,
      preload: true,
      loop: true,
    });

    music.volume();
    music.play();
    musicRegistry.set("base", music);
  }

  function muteMusic() {
    [...musicRegistry.values()].forEach((entry) => {
      entry.pause();
    });
    setComponent(clientComponents.Volume, 1 as EntityIndex, { value: 0 });
    localStorage.setItem("music-volume", "0");
  }

  function handleNewActionsSpecial(action: ActionType, shipEntity: EntityIndex) {
    const selectedActions = getComponentValue(clientComponents.SelectedActions, shipEntity) || {
      actionTypes: [ActionType.None, ActionType.None],
      specialEntities: ["0" as EntityID, "0" as EntityID],
    };

    const actions = structuredClone(selectedActions);
    const index = actions.actionTypes.indexOf(action);
    if (index == -1) {
      const unusedSlot = actions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      actions.actionTypes[unusedSlot] = action;
      actions.specialEntities[unusedSlot] = "0" as EntityID;
    } else {
      actions.actionTypes[index] = ActionType.None;
      actions.specialEntities[index] = "0" as EntityID;
    }
    setComponent(clientComponents.SelectedActions, shipEntity, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(clientComponents.SelectedShip, godEntity, { value: shipEntity });
  }

  function handleNewActionsCannon(action: ActionType, cannonEntity: EntityIndex) {
    const shipID = getComponentValueStrict(components.OwnedBy, cannonEntity).value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;
    const selectedActions = getComponentValue(clientComponents.SelectedActions, shipEntity) || {
      actionTypes: [ActionType.None, ActionType.None],
      specialEntities: ["0" as EntityID, "0" as EntityID],
    };
    const actions = structuredClone(selectedActions);
    const entityID = world.entities[cannonEntity];
    const index = actions.specialEntities.indexOf(entityID);

    // couldn't find the cannon
    if (index == -1) {
      const unusedSlot = selectedActions.actionTypes.indexOf(ActionType.None);
      if (unusedSlot == -1) return;
      actions.actionTypes[unusedSlot] = action;
      actions.specialEntities[unusedSlot] = entityID;
    } else {
      actions.actionTypes[index] = ActionType.None;
      actions.specialEntities[index] = "0" as EntityID;
    }
    setComponent(clientComponents.SelectedActions, shipEntity, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(clientComponents.SelectedShip, godEntity, { value: shipEntity });
  }

  function getSpriteObject(id: string | number, s?: Phaser.Scene): Phaser.GameObjects.Sprite {
    const scene = s || mainScene;
    const sprite = spriteRegistry.get(id);
    if (sprite) return sprite;

    const newSprite = scene.add.sprite(5, 5, "");
    spriteRegistry.set(id, newSprite);
    return newSprite;
  }

  function destroySpriteObject(id: string | number) {
    const sprite = spriteRegistry.get(id);
    spriteRegistry.delete(id);
    if (!sprite) return;

    sprite.destroy(true);
  }

  function getGroupObject(id: string | number, clear = false, s?: Phaser.Scene): Phaser.GameObjects.Group {
    const scene = s || mainScene;
    if (clear) destroyGroupObject(id);
    const group = polygonRegistry.get(id);
    if (group) return group;

    const newGroup = scene.add.group();
    polygonRegistry.set(id, newGroup);
    return newGroup;
  }

  function destroyGroupObject(id: string | number) {
    const group = polygonRegistry.get(id);
    polygonRegistry.delete(id);
    if (!group || !group.getChildren()?.length) return;
    group.destroy(true, true);
  }
  function toRadians(angle: number) {
    return angle * (Math.PI / 180);
  }
  function renderMovePath(
    shipEntity: EntityIndex,
    objectId: string,
    direction: number,
    rotation: number,
    finalPosition: Coord
  ) {
    console.log("rotation: ", rotation);
    direction = direction > 180 ? 360 - direction : direction;
    rotation = rotation > 180 ? 360 - rotation : rotation;

    const origin = getComponentValueStrict(components.Position, shipEntity);
    const initialRotation = getComponentValueStrict(components.Rotation, shipEntity).value;

    const hypoteneuse = distance(finalPosition, origin);
    console.log("hypoteneuse distance: ", hypoteneuse);
    const rightDistance = hypoteneuse * Math.cos(toRadians(direction));
    console.log("right distance: ", rightDistance);
    const finalDistance = (rightDistance * rotation) / 90;
    console.log("final distance: ", finalDistance);
    const midpoint = getPositionByVector(origin, initialRotation, finalDistance, 0);

    const points = [origin, midpoint, finalPosition].map((coord) => {
      const pixelPos = tileCoordToPixelCoord(coord, POS_HEIGHT, POS_WIDTH);
      return new Phaser.Math.Vector2(pixelPos.x, pixelPos.y);
    });

    const path = new Phaser.Curves.QuadraticBezier(points[0], points[1], points[2]);

    const graphics = mainScene.add.graphics();
    graphics.lineStyle(8, 0xffffff);
    // path.draw(graphics, 16);
    path.draw(graphics);

    return graphics;
  }

  function renderShip(
    shipEntity: EntityIndex,
    objectId: string,
    position: Coord,
    rotation: number,
    tint = colors.whiteHex,
    alpha = 1,
    register = true
  ) {
    const object = register ? getSpriteObject(objectId) : mainScene.add.sprite(0, 0, "none");

    const length = getComponentValueStrict(components.Length, shipEntity).value;
    const health = getComponentValueStrict(clientComponents.HealthLocal, shipEntity).value;
    const maxHealth = getComponentValueStrict(components.MaxHealth, shipEntity).value;
    const ownerID = getComponentValueStrict(components.OwnedBy, shipEntity).value;
    const ownerEntity = world.entityToIndex.get(ownerID);
    const playerEntity = getPlayerEntity();
    if (!ownerEntity) return;
    const spriteAsset: Sprites = getShipSprite(ownerEntity, health, maxHealth, ownerEntity == playerEntity);

    const sprite = sprites[spriteAsset];

    const { x, y } = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

    object.setTexture(sprite.assetKey, sprite.frame);

    object.setAngle((rotation - 90) % 360);
    const shipLength = length * POS_WIDTH * 1.25;
    const shipWidth = shipLength / SHIP_RATIO;
    object.setOrigin(0.5, 0.92);
    object.setDisplaySize(shipWidth, shipLength);
    object.setPosition(x, y);
    object.setAlpha(alpha);
    object.setTint(tint);
    object.setDepth(RenderDepth.Foreground5);

    return object;
  }

  function getFiringAreaPixels(position: Coord, rotation: number, length: number, cannonEntity: EntityIndex) {
    const range = getCannonRange(cannonEntity) * POS_HEIGHT;

    const pixelPosition = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);
    const cannonRotation = getComponentValueStrict(components.Rotation, cannonEntity).value;

    return getFiringArea(pixelPosition, range, length * POS_HEIGHT, rotation, cannonRotation);
  }

  function renderShipFiringAreas(shipEntity: EntityIndex, groupId: string, position?: Coord, rotation?: number) {
    const activeGroup = getGroupObject(groupId, true);

    const selectedActions = getComponentValue(clientComponents.SelectedActions, shipEntity);
    const cannonEntities = [
      ...runQuery([Has(components.Cannon), HasValue(components.OwnedBy, { value: world.entities[shipEntity] })]),
    ];
    const gameStarted = (getTurn(clock.currentTime) || 0) >= (getGameConfig()?.entryCutoffTurns || 0);
    const damagedCannons =
      getComponentValue(clientComponents.DamagedCannonsLocal, shipEntity)?.value != 0 || !gameStarted;
    const myShip = isMyShip(shipEntity);
    cannonEntities.forEach((cannonEntity) => {
      const loaded = getComponentValue(components.Loaded, cannonEntity);
      const cannonSelected = selectedActions?.specialEntities.includes(world.entities[cannonEntity]);
      const cannotAdd = selectedActions?.actionTypes.every((action, i) => action !== ActionType.None);

      const rangeColor = getRangeTintAlpha(!!loaded, !!cannonSelected, damagedCannons);
      const firingPolygon = renderCannonFiringArea(
        activeGroup,
        shipEntity,
        cannonEntity,
        rangeColor,
        undefined,
        position,
        rotation
      );
      const actionType = loaded ? ActionType.Fire : ActionType.Load;

      const shipOwner = getShipOwner(shipEntity);
      const currentTurn = getTurn(clock.currentTime);
      const phase = getPhase(clock.currentTime);
      if (!shipOwner) return;
      const acted = getComponentValue(components.LastAction, shipOwner)?.value == currentTurn;
      if (damagedCannons || !myShip || acted || (cannotAdd && !cannonSelected) || phase !== Phase.Action) return;
      firingPolygon.setInteractive(firingPolygon.geom, Phaser.Geom.Polygon.Contains);
      firingPolygon.on("pointerdown", () => handleNewActionsCannon(actionType, cannonEntity));
      firingPolygon.on("pointerover", () =>
        setComponent(clientComponents.HoveredAction, godEntity, { shipEntity, actionType, specialEntity: cannonEntity })
      );
      firingPolygon.on("pointerout", () => removeComponent(clientComponents.HoveredAction, godEntity));
    });
  }

  function renderCannonFiringArea(
    group: Phaser.GameObjects.Group,
    shipEntity: EntityIndex,
    cannonEntity: EntityIndex,
    fill?: { tint: number; alpha: number },
    stroke?: { tint: number; alpha: number },
    position?: Coord,
    rotation?: number
  ) {
    const length = getComponentValueStrict(components.Length, shipEntity).value;
    position = position || getComponentValueStrict(components.Position, shipEntity);
    rotation = rotation || getComponentValueStrict(components.Rotation, shipEntity).value;
    const firingArea = getFiringAreaPixels(position, rotation, length, cannonEntity);
    const firingPolygon = mainScene.add.polygon(undefined, undefined, firingArea, colors.whiteHex, 0.3);
    firingPolygon.setDisplayOrigin(0);
    firingPolygon.setDepth(RenderDepth.Foreground6);

    if (fill) {
      firingPolygon.setFillStyle(fill.tint, fill.alpha);
    }
    if (stroke) {
      firingPolygon.setStrokeStyle(6, stroke.tint, stroke.alpha);
    }
    group.add(firingPolygon, true);

    const damagedCannons = getComponentValue(clientComponents.DamagedCannonsLocal, shipEntity)?.value;
    const showText = !damagedCannons && getPhase(clock.currentTime) == Phase.Action && isMyShip(shipEntity);
    if (!showText) return firingPolygon;

    const cannonRotation = getComponentValueStrict(components.Rotation, cannonEntity).value;
    const suffix = isBroadside(cannonRotation) ? "BROADSIDE" : "PIVOT GUN";

    const loaded = getComponentValue(components.Loaded, cannonEntity)?.value;
    const prefix = loaded ? "FIRE" : "LOAD";

    const textPosition = getPolygonCenter(firingArea);
    const textObject = mainScene.add.text(textPosition.x, textPosition.y, `${prefix}\n${suffix}`, {
      color: colors.white,
      align: "center",
      fontFamily: "Inknut Antiqua",
      fontSize: "40px",
    });

    textObject.setDepth(RenderDepth.Foreground5);
    textObject.setOrigin(0.5);

    textObject.setAngle(((cannonRotation + rotation + 90) % 180) - 90);
    group.add(textObject, true);
    return firingPolygon;
  }

  function renderCircle(
    group: Phaser.GameObjects.Group,
    position: Coord,
    length: number,
    rotation: number,
    tint = colors.whiteHex,
    alpha = 1
  ) {
    const circleWidth = length * POS_WIDTH * 1.5;
    const circleHeight = circleWidth / SHIP_RATIO;

    const circle = mainScene.add.ellipse(
      position.x * POS_HEIGHT,
      position.y * POS_HEIGHT,
      circleWidth,
      circleHeight,
      colors.goldHex,
      0.5
    );

    circle.setAngle(rotation % 360);
    circle.setOrigin(0.85, 0.5);
    circle.setDepth(RenderDepth.Foreground5);
    circle.setFillStyle(tint, alpha);

    group.add(circle, true);
  }

  const nameRegistry = new Map<EntityID, string>();

  function getShipName(shipEntity: EntityIndex) {
    const shipID = world.entities[shipEntity];
    const value = nameRegistry.get(shipID);
    if (value) return value;

    const hash = getHash(shipID);
    const adjective = adjectives[hash % adjectives.length];
    const newHash = getHash(`${hash}`);
    const noun = nouns[newHash % nouns.length];

    const name = cap(adjective) + " " + cap(noun);
    nameRegistry.set(shipID, name);
    return name;
  }

  async function moveElement(object: Phaser.GameObjects.GameObject, coord: Coord) {
    mainScene.add.tween({
      targets: object,
      duration: MOVE_LENGTH,
      props: { x: coord.x, y: coord.y },
      ease: Phaser.Math.Easing.Sine.InOut,
    });
  }

  startEnvironmentSoundSystem();
  playMusic();

  return {
    getGameConfig,
    getPlayerEntity,
    pixelCoord,
    getPhase,
    getGamePhaseAt,
    getTurn,
    decodeShipPrototype,
    secondsUntilNextPhase,
    secondsIntoTurn,
    bigNumToEntityID,
    checkActionPossible,
    getShipOwner,
    getPlayerShips,
    getPlayerShipsWithMoves,
    getPlayerShipsWithActions,
    getTargetedShips,
    getCannonRange,
    getCannonFirepower,
    isMyShip,
    outOfBounds,
    isWhirlpool,
    clearComponent,
    getDamageLikelihood,
    playSound,
    handleNewActionsCannon,
    handleNewActionsSpecial,
    muteSfx,
    unmuteSfx,
    playMusic,
    muteMusic,
    inWorld,
    getWorldDimsAtTime,
    getSpriteObject,
    getGroupObject,
    destroySpriteObject,
    destroyGroupObject,
    renderShipFiringAreas,
    renderCannonFiringArea,
    renderMovePath,
    renderCircle,
    moveElement,
    getFiringAreaPixels,
    renderShip,
    getShipName,
  };
}
