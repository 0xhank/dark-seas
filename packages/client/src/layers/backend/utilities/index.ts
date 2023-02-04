import { createPerlin } from "@latticexyz/noise";
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
import { Coord } from "@latticexyz/utils";
import { Howl } from "howler";
import { Action, ActionType, Move } from "../../../types";
import { distance } from "../../../utils/distance";
import { getFiringArea, getSternLocation, inFiringArea } from "../../../utils/trig";
import { DELAY } from "../../frontend/constants";
import { NetworkLayer } from "../../network";
import { BackendComponents } from "../createBackendComponents";
import { Category, soundLibrary } from "../sound/library";

export async function createBackendUtilities(
  network: NetworkLayer,
  components: BackendComponents,
  godEntity: EntityIndex
) {
  const {
    world,
    utils: { getPlayerEntity, getGameConfig, getTurn },
    components: { Ship, OwnedBy, Range, Position, Rotation, Length, Firepower },
    network: { connectedAddress },
  } = network;

  const perlin = await createPerlin();

  function clearComponent(component: Component) {
    [...component.entities()].forEach((entity) => removeComponent(component, entity));
  }

  function isMyShip(shipEntity: EntityIndex): boolean {
    const owner = getComponentValue(OwnedBy, shipEntity)?.value;
    const myAddress = connectedAddress.get();
    if (!owner || !myAddress) return false;
    return owner == myAddress;
  }

  function checkActionPossible(action: ActionType, ship: EntityIndex): boolean {
    if (isNaN(action)) return false;
    if (action == ActionType.None) return false;
    if (action == ActionType.Fire) return false;
    if (action == ActionType.Load) return false;
    if (action == ActionType.ExtinguishFire && !getComponentValue(components.OnFireLocal, ship)?.value) return false;

    if (action == ActionType.RepairCannons && !getComponentValue(components.DamagedCannonsLocal, ship)?.value)
      return false;

    const sailPosition = getComponentValueStrict(components.SailPositionLocal, ship).value;
    if (action == ActionType.LowerSail && sailPosition != 2) return false;
    if (action == ActionType.RaiseSail && sailPosition != 1) return false;
    if (action == ActionType.RepairSail && sailPosition > 0) return false;

    return true;
  }

  function getPlayerShips(player?: EntityIndex) {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[player] })])];
    if (ships.length == 0) return;

    return ships;
  }
  function getPlayerShipsWithMoves(player?: EntityIndex): Move[] | undefined {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return;
    const ships = [...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedMove)])];
    if (ships.length == 0) return;
    const moves = ships.map((ship) => {
      const move = getComponentValueStrict(components.SelectedMove, ship).value as EntityIndex;
      return {
        shipEntity: world.entities[ship],
        moveCardEntity: world.entities[move],
      };
    });
    return moves;
  }

  function getTargetedShips(cannonEntity: EntityIndex): EntityIndex[] {
    const shipID = getComponentValue(OwnedBy, cannonEntity)?.value;
    if (!shipID) return [];
    const shipEntity = world.entityToIndex.get(shipID);

    const address = connectedAddress.get() as EntityID;
    if (!address || !shipEntity) return [];

    const length = getComponentValueStrict(Length, shipEntity).value;
    const shipPosition = getComponentValueStrict(Position, shipEntity);
    const shipRotation = getComponentValueStrict(Rotation, shipEntity).value;
    const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;

    const shipEntities = [...runQuery([Has(Ship), NotValue(OwnedBy, { value: address })])].filter((targetEntity) => {
      if (targetEntity == shipEntity) return false;
      if (getComponentValue(components.HealthLocal, targetEntity)?.value == 0) return false;

      const enemyPosition = getComponentValueStrict(Position, targetEntity);
      const enemyRotation = getComponentValueStrict(Rotation, targetEntity).value;
      const enemyLength = getComponentValueStrict(Length, targetEntity).value;
      const sternPosition = getSternLocation(enemyPosition, enemyRotation, enemyLength);
      const range = getComponentValueStrict(Range, cannonEntity).value;

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
    const shipID = getComponentValue(OwnedBy, cannonEntity)?.value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;

    const shipPosition = getComponentValueStrict(Position, shipEntity);
    const targetPosition = getComponentValueStrict(Position, target);
    const dist = distance(shipPosition, targetPosition);

    const firepower = getComponentValueStrict(Firepower, cannonEntity).value;
    const baseHitChance = getBaseHitChance(dist, firepower);

    const format = (n: number) => Math.min(100, Math.round(n));
    return { 3: format(baseHitChance), 2: format(baseHitChance * 1.7), 1: format(baseHitChance * 4.5) };
  }

  function getPlayerShipsWithActions(player?: EntityIndex): Action[] {
    if (!player) player = getPlayerEntity(connectedAddress.get());
    if (!player) return [];
    const ships = [
      ...runQuery([HasValue(OwnedBy, { value: world.entities[player] }), Has(components.SelectedActions)]),
    ];
    if (ships.length == 0) return [];

    return ships.reduce((prevActions: Action[], ship: EntityIndex) => {
      const actions = getComponentValueStrict(components.SelectedActions, ship);
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
    const volume = getComponentValueStrict(components.Volume, godEntity).value;
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
    setComponent(components.Volume, godEntity, { value: 1 });
    localStorage.setItem("volume", "1");
    playSound("ocean", Category.Ambience, true);
  }
  function muteSfx() {
    [...soundRegistry.values()].forEach((entry) => {
      entry.pause();
    });
    setComponent(components.Volume, godEntity, { value: 0 });
    localStorage.setItem("volume", "0");
  }

  function startEnvironmentSoundSystem() {
    const volumeStr = localStorage.getItem("volume");
    const volume = volumeStr ? Number(volumeStr) : 1;
    setComponent(components.Volume, godEntity, { value: volume });

    playSound("ocean", Category.Ambience, true);
  }

  function playMusic(vol?: number) {
    if (vol !== undefined) {
      localStorage.setItem("music-volume", `${vol}`);
    }
    const volumeStr = localStorage.getItem("music-volume");
    const volume = vol || volumeStr ? Number(volumeStr) : 1;
    setComponent(components.Volume, 1 as EntityIndex, { value: volume });

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
    setComponent(components.Volume, 1 as EntityIndex, { value: 0 });
    localStorage.setItem("music-volume", "0");
  }

  function handleNewActionsSpecial(action: ActionType, shipEntity: EntityIndex) {
    const selectedActions = getComponentValue(components.SelectedActions, shipEntity) || {
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
    setComponent(components.SelectedActions, shipEntity, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(components.SelectedShip, godEntity, { value: shipEntity });
  }

  function handleNewActionsCannon(action: ActionType, cannonEntity: EntityIndex) {
    const shipID = getComponentValueStrict(OwnedBy, cannonEntity).value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;
    const selectedActions = getComponentValue(components.SelectedActions, shipEntity) || {
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
    setComponent(components.SelectedActions, shipEntity, {
      actionTypes: actions.actionTypes,
      specialEntities: actions.specialEntities,
    });
    setComponent(components.SelectedShip, godEntity, { value: shipEntity });
  }

  startEnvironmentSoundSystem();
  playMusic();

  return {
    checkActionPossible,
    getPlayerShips,
    getPlayerShipsWithMoves,
    getPlayerShipsWithActions,
    getTargetedShips,
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
