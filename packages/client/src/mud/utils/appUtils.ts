import {
  Component,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";

import { BigNumber, BigNumberish } from "ethers";
import { components } from "../../components";
import { distance } from "../../utils/distance";
import { cap, getHash } from "../../utils/ships";
import { adjectives, nouns } from "../../utils/wordlist";
import { world } from "../../world";

export type NetworkUtils = Awaited<ReturnType<typeof createAppUtilities>>;

export function createAppUtilities(ownerAddress: string) {
  function bigNumToEntityID(bigNum: BigNumberish): EntityID {
    return BigNumber.from(bigNum).toHexString() as EntityID;
  }
  function getOwnerEntity(address?: string): EntityIndex | undefined {
    if (!address) address = ownerAddress;
    const playerEntity = world.entityToIndex.get(address as EntityID);
    return playerEntity;
  }

  function clearComponent(component: Component) {
    [...component.entities()].forEach((entity) => removeComponent(component, entity));
  }

  function isMyShip(shipEntity: EntityIndex): boolean {
    const owner = getComponentValue(components.OwnedBy, shipEntity)?.value;
    if (!owner) return false;
    return owner == ownerAddress;
  }

  function getShipOwner(shipEntity: EntityIndex) {
    const owner = getComponentValue(components.OwnedBy, shipEntity)?.value;
    if (!owner) return;
    return world.entityToIndex.get(owner);
  }

  function getPlayerShips(player?: EntityIndex) {
    if (!player) player = getOwnerEntity();
    if (!player) return [];
    const ships = [
      ...runQuery([Has(components.Ship), HasValue(components.OwnedBy, { value: world.entities[player] })]),
    ];

    return ships;
  }

  function getBaseHitChance(distance: number, firepower: number) {
    return (25 * Math.exp(-0.008 * distance) * firepower) / 10;
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
    const baseHitChance = getBaseHitChance(dist, firepower);

    const format = (n: number) => Math.min(100, Math.round(n));
    return { 3: format(baseHitChance), 2: format(baseHitChance * 1.7), 1: format(baseHitChance * 6.5) };
  }

  function getCannonOwner(cannonEntity: EntityIndex) {
    const shipID = getComponentValue(components.OwnedBy, cannonEntity)?.value;
    if (!shipID) return;
    const shipEntity = world.entityToIndex.get(shipID);
    if (!shipEntity) return;
    return shipEntity;
  }

  function getCannonRange(cannonEntity: EntityIndex) {
    return getComponentValue(components.Range, cannonEntity)?.value || 0;
  }

  function getCannonFirepower(cannonEntity: EntityIndex) {
    const firepower = getComponentValue(components.Firepower, cannonEntity)?.value;
    const shipEntity = getCannonOwner(cannonEntity);
    if (!shipEntity) return 0;
    const shipFirepower = getComponentValue(components.Firepower, shipEntity)?.value || 0;
    if (firepower == undefined) return 0;

    return firepower + shipFirepower;
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

  return {
    getOwnerEntity,
    bigNumToEntityID,
    getShipOwner,
    getPlayerShips,
    getCannonRange,
    getCannonFirepower,
    isMyShip,
    clearComponent,
    getDamageLikelihood,
    getShipName,
  };
}
