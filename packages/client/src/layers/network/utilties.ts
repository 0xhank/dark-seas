import { Clock } from "@latticexyz/network";
import { createPerlin } from "@latticexyz/noise";
import {
  Component,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  hasComponent,
  HasValue,
  NotValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { BigNumber, BigNumberish } from "ethers";
import { Howl } from "howler";
import { Category, soundLibrary } from "../../sound";
import { Action, ActionType, Move, Phase } from "../../types";
import { distance } from "../../utils/distance";
import { getFiringArea, getSternLocation, inFiringArea } from "../../utils/trig";
import { DELAY } from "../frontend/constants";
import { clientComponents, components } from "./components";
import { world } from "./world";

export async function createUtilities(
  godEntity: EntityIndex,
  playerEntity: EntityIndex,
  playerAddress: string,
  clock: Clock
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
    if (!address) return;
    if (!hasComponent(components.Player, playerEntity)) return;

    return playerEntity;
  }

  function getPhase(delay = 0): Phase | undefined {
    const time = Math.floor(clock.currentTime / 1000) + delay;
    const gamePhase = getGamePhaseAt(time);
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

  function getTurn(delay = 0): number | undefined {
    const time = Math.floor(clock.currentTime / 1000) + delay;
    const gameTurn = getGameTurnAt(time);
    return gameTurn;
  }

  function getGameTurnAt(timeInSeconds: number): number | undefined {
    const gameConfig = getGameConfig();
    if (!gameConfig) return undefined;
    const timeElapsed = timeInSeconds - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;

    return Math.floor(timeElapsed / turnLength);
  }

  function secondsIntoTurn(delay = 0) {
    const gameConfig = getGameConfig();
    const phase = getPhase(delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor(clock.currentTime / 1000) + delay - parseInt(gameConfig.startTime);
    const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
    return gameLength % turnLength;
  }

  function secondsUntilNextPhase(delay = 0) {
    const gameConfig = getGameConfig();
    const phase = getPhase(delay);

    if (!gameConfig || phase == undefined) return;

    const gameLength = Math.floor(clock.currentTime / 1000) + delay - parseInt(gameConfig.startTime);
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

  function clearComponent(component: Component) {
    [...component.entities()].forEach((entity) => removeComponent(component, entity));
  }

  function isMyShip(shipEntity: EntityIndex): boolean {
    const owner = getComponentValue(components.OwnedBy, shipEntity)?.value;
    if (!owner) return false;
    return owner == playerAddress;
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

  function getPlayerShips(player?: EntityIndex) {
    if (!player) player = getPlayerEntity();
    if (!player) return;
    const ships = [
      ...runQuery([Has(components.Ship), HasValue(components.OwnedBy, { value: world.entities[player] })]),
    ];
    if (ships.length == 0) return;

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
    if (!shipID) return [];
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
      const sternPosition = getSternLocation(enemyPosition, enemyRotation, enemyLength);
      const range = getCannonRange(cannonEntity);
      const firingArea = getFiringArea(shipPosition, range, length, shipRotation, cannonRotation);

      const toTarget = inFiringArea(firingArea, enemyPosition) || inFiringArea(firingArea, sternPosition);
      return toTarget;
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
    return { 3: format(baseHitChance), 2: format(baseHitChance * 1.7), 1: format(baseHitChance * 4.5) };
  }

  function getPlayerShipsWithActions(player?: EntityIndex): Action[] {
    if (!player) player = playerEntity;
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
    if (range == undefined || kills == undefined) return 0;

    return range * (1 + kills / 10);
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

  function getWorldHeightAtTurn(turn: number): number {
    const gameConfig = getGameConfig();
    if (!gameConfig) return 0;
    if (turn <= gameConfig.entryCutoffTurns || gameConfig.shrinkRate == 0) return gameConfig.worldSize;
    const turnsAfterCutoff = turn - gameConfig.entryCutoffTurns;
    const finalSize = gameConfig.worldSize - (gameConfig.shrinkRate / 100) * turnsAfterCutoff;

    return finalSize < 50 ? 50 : Math.ceil(finalSize);
  }

  function getWorldDimsAtTurn(turn?: number) {
    const theTurn = turn == undefined ? getTurn(DELAY) || 0 : turn;
    const height = getWorldHeightAtTurn(theTurn);

    return { height, width: (height * 16) / 9 };
  }

  function inWorld(a: Coord): boolean {
    const turn = getTurn(DELAY);
    if (turn == undefined) return false;
    const dims = getWorldDimsAtTurn(turn);

    return Math.abs(a.x) < dims.width && Math.abs(a.y) < dims.height;
  }

  function outOfBounds(position: Coord) {
    const gameConfig = getGameConfig();
    if (!gameConfig) return false;

    if (!inWorld(position)) return true;

    const whirlpool = isWhirlpool(position, Number(gameConfig.perlinSeed));
    if (whirlpool) return true;
    return false;
  }

  function isWhirlpool(coord: Coord, perlinSeed: number): boolean {
    const coordStr = `${coord.x}-${coord.y}`;
    const retrievedVal = whirlpoolMap.get(coordStr);

    if (retrievedVal != undefined) return retrievedVal;
    const denom = 50;
    const depth = perlin(coord.x + perlinSeed, coord.y + perlinSeed, 0, denom);
    const ret = depth * 100 < 33;
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

  startEnvironmentSoundSystem();
  playMusic();

  return {
    getGameConfig,
    getPlayerEntity,
    getPhase,
    getGamePhaseAt,
    getTurn,
    secondsUntilNextPhase,
    secondsIntoTurn,
    bigNumToEntityID,
    checkActionPossible,
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
    getWorldDimsAtTurn,
  };
}
