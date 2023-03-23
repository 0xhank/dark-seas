// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../components/MaxHealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { LastHitComponent, ID as LastHitComponentID } from "../components/LastHitComponent.sol";
import { CannonComponent, ID as CannonComponentID } from "../components/CannonComponent.sol";
import { LoadedComponent, ID as LoadedComponentID } from "../components/LoadedComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Coord, Line, Upgrade } from "../libraries/DSTypes.sol";

// Libraries
import "./LibVector.sol";
import "./LibUtils.sol";
import "./LibTurn.sol";
import "./LibCrate.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";

library LibCombat {
  /***************************************************** LOAD **************************************************** */

  /**a
   * @notice  loads the given cannon
   * @param   world world and components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function load(
    IWorld world,
    uint256 shipEntity,
    uint256 cannonEntity
  ) internal {
    if (DamagedCannonsComponent(LibUtils.addressById(world, DamagedCannonsComponentID)).has(shipEntity)) return;

    require(
      CannonComponent(LibUtils.addressById(world, CannonComponentID)).has(cannonEntity),
      "load: entity not a cannon"
    );

    require(
      OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(cannonEntity) == shipEntity,
      "load: cannon not owned by ship"
    );

    LoadedComponent loadedComponent = LoadedComponent(LibUtils.addressById(world, LoadedComponentID));
    require(!loadedComponent.has(cannonEntity), "attack: cannon already loaded");
    loadedComponent.set(cannonEntity);
  }

  /*************************************************** ATTACK **************************************************** */
  /**
   * @notice  fires the given cannon
   * @param   world world and components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function attack(
    IWorld world,
    uint256 shipEntity,
    uint256 cannonEntity,
    uint256[] memory targetEntities
  ) internal {
    if (DamagedCannonsComponent(LibUtils.addressById(world, DamagedCannonsComponentID)).has(shipEntity)) return;

    require(
      LibTurn.getCurrentTurn(world) >
        GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(GodID).entryCutoffTurns,
      "attack: cannot fire before entry cuts off"
    );
    require(
      CannonComponent(LibUtils.addressById(world, CannonComponentID)).has(cannonEntity),
      "attack: entity not a cannon"
    );

    require(
      OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(cannonEntity) == shipEntity,
      "attack: cannon not owned by ship"
    );

    LoadedComponent loadedComponent = LoadedComponent(LibUtils.addressById(world, LoadedComponentID));
    require(loadedComponent.has(cannonEntity), "attack: cannon not loaded");
    loadedComponent.remove(cannonEntity);

    if (targetEntities.length == 0) return;
    for (uint256 i = 1; i < targetEntities.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        require(targetEntities[i] != targetEntities[j], "attack: target already shot at");
      }
    }

    executeAttack(world, shipEntity, cannonEntity, targetEntities);
  }

  /**
   * @notice  attacks all enemies in forward arc of ship
   * @dev     todo: how can i combi:wne this with attackSide despite different number of vertices in range?
   * @param   world world and components
   * @param   shipEntity  entity performing an attack
   * @param   cannonEntity  .
   */
  function executeAttack(
    IWorld world,
    uint256 shipEntity,
    uint256 cannonEntity,
    uint256[] memory targetEntities
  ) private {
    FirepowerComponent firepowerComponent = FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID));
    uint32 firepower = firepowerComponent.getValue(cannonEntity) + firepowerComponent.getValue(shipEntity);

    // get firing area of ship
    Coord[] memory firingRange = getFiringArea(world, shipEntity, cannonEntity);

    // iterate through each ship, checking if it is within firing range
    for (uint256 i = 0; i < targetEntities.length; i++) {
      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternPosition(world, targetEntities[i]);
      if (
        LibVector.withinPolygon(aft, firingRange) ||
        LibVector.lineIntersectsPolygon(Line({ start: stern, end: aft }), firingRange)
      ) {
        uint256 distance = LibVector.distance(firingRange[0], aft);
        damageEnemy(world, shipEntity, targetEntities[i], distance, firepower);
      }
    }
  }

  /**
   * @notice  damages enemy hull, and special attacks
   * @dev     cheat sheet https://tinyurl.com/ds-math
   * @param   world world and components
   * @param   attackerEntity  attacking entity
   * @param   distance  distance between attacker and defender
   * @param   firepower  firepower of cannon firing
   */
  function damageEnemy(
    IWorld world,
    uint256 attackerEntity,
    uint256 defenderEntity,
    uint256 distance,
    uint32 firepower
  ) public {
    uint256 baseHitChance = getBaseHitChance(distance, firepower);

    uint256 r = LibUtils.randomness(attackerEntity, defenderEntity);

    // perform hull damage
    uint32 hullDamage = getHullDamage(baseHitChance, r);
    if (hullDamage == 0) return;

    LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).set(defenderEntity, attackerEntity);
    bool dead = damageHull(world, hullDamage, defenderEntity);

    if (dead) return;

    // perform special damage
    if (getSpecialChance(baseHitChance, hullDamage, r, 0)) {
      OnFireComponent(LibUtils.addressById(world, OnFireComponentID)).set(defenderEntity, 1);
    }
    if (getSpecialChance(baseHitChance, hullDamage, r, 1)) {
      DamagedCannonsComponent(LibUtils.addressById(world, DamagedCannonsComponentID)).set(defenderEntity, 2);
    }
    if (getSpecialChance(baseHitChance, hullDamage, r, 2)) {
      SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(defenderEntity, 0);
    }
  }

  /**
   * @notice  applies damage to hull
   * @param   world world and components
   * @param   damage  amount of damage applied
   * @param   shipEntity  to apply damage to
   * @return  bool  if the damage killed the boat
   */
  function damageHull(
    IWorld world,
    uint32 damage,
    uint256 shipEntity
  ) public returns (bool) {
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    uint32 health = healthComponent.getValue(shipEntity);

    if (health <= damage) {
      killShip(world, shipEntity);
      return true;
    }

    healthComponent.set(shipEntity, health - damage);
    return false;
  }

  /**
   * @notice  kills enemy and rewards the attacker
   * @param   world world and components
   * @param   shipEntity  ship that got killed
   */
  function killShip(IWorld world, uint256 shipEntity) private {
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    Coord memory position = PositionComponent(LibUtils.addressById(world, PositionComponentID)).getValue(shipEntity);
    uint256 attackerEntity = LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).getValue(shipEntity);

    HealthComponent(LibUtils.addressById(world, HealthComponentID)).set(shipEntity, 0);
    Upgrade memory upgrade = Upgrade({ componentId: HealthComponentID, amount: 1 });
    LibCrate.createCrate(world, position);
  }

  /*************************************************** UTILITIES **************************************************** */
  /**
   * @notice overview: increases damage as your firepower increases OR distance decreases
          equation: 25 * e^(-.008 * distance) * (firepower / 10), multiplied by 100 for precision.
          
   * @param   distance  from target
   * @param   firepower  of attacker
   * @return  hitChance  based on above equation
   */
  function getBaseHitChance(uint256 distance, uint256 firepower) public pure returns (uint256 hitChance) {
    int128 _scaleInv = Math.exp(Math.divu(distance * 8, 1000));
    int128 firepowerDebuff = Math.divu(firepower, 10);
    int128 beforeDebuff = Math.div(Math.fromUInt(2500), _scaleInv);
    hitChance = Math.toUInt(Math.mul(beforeDebuff, firepowerDebuff));
  }

  /**
   * @notice  calculates hull damage from base hit chance and randomly generated seed
   * @dev chance of 3 damage is base chance, 2 damage is 1.7x, 1 damage is 3.5x
   * @param   baseHitChance calculated using getBaseHitChance
   * @param   randomSeed calculated using randomness
   * @return  uint32 hull damage incurred
   */
  function getHullDamage(uint256 baseHitChance, uint256 randomSeed) public pure returns (uint32) {
    // use first 14 bits for hull damage (log_2(10000) = ~13.2)
    uint256 odds = (LibUtils.getByteUInt(randomSeed, 14, 0) * 10000) / 16384;
    if (odds <= baseHitChance) return 3;
    if (odds <= (baseHitChance * 170) / 100) return 2;
    if (odds <= (baseHitChance * 650) / 100) return 1;
    return 0;
  }

  /**
   * @notice  calculates special chance from base hit chance, number of hits, and randomly generated seed
   * @dev     calculation: base chance * 0.6, 10% more likely for each damage incurred
   * @param   baseHitChance calculated using getBaseHitChance
   * @param   damage  calculated using getHullDamage
   * @param   randomSeed  calculated using randomness
   * @param   shift  used to produce different result for each type of special damage
   * @return  bool  did the special damage occur
   */
  function getSpecialChance(
    uint256 baseHitChance,
    uint256 damage,
    uint256 randomSeed,
    uint256 shift
  ) public pure returns (bool) {
    // pre-shifted to account for hull damage
    uint256 odds = ((LibUtils.getByteUInt(randomSeed, 14, (shift + 2) * 14)) * 10000) / 16384;
    uint256 outcome = (baseHitChance * 6) / 10;
    outcome = (outcome * ((damage - 1) + 10)) / 10;
    return (odds <= outcome);
  }

  function getFiringArea(
    IWorld world,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public view returns (Coord[] memory) {
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));

    uint32 range = RangeComponent(LibUtils.addressById(world, RangeComponentID)).getValue(cannonEntity);
    Coord memory position = PositionComponent(LibUtils.addressById(world, PositionComponentID)).getValue(shipEntity);
    uint32 shipRotation = rotationComponent.getValue(shipEntity);
    uint32 cannonRotation = rotationComponent.getValue(cannonEntity);
    uint32 length = LengthComponent(LibUtils.addressById(world, LengthComponentID)).getValue(shipEntity);
    Coord memory frontCorner;
    Coord memory backCorner;
    Coord[] memory ret;
    if (cannonRotation == 90 || cannonRotation == 270) {
      uint32 rightRange = (cannonRotation + 10) % 360;
      uint32 leftRange = (cannonRotation + 350) % 360;

      Coord memory sternPosition = LibVector.getSternPosition(position, shipRotation, length);

      // if the stern is above the bow, switch the corners to ensure the quadrilateral doesn't cross in the middle
      if (cannonRotation % 360 >= 180) {
        frontCorner = LibVector.getPositionByVector(position, shipRotation, range, rightRange);
        backCorner = LibVector.getPositionByVector(sternPosition, shipRotation, range, leftRange);
      } else {
        frontCorner = LibVector.getPositionByVector(position, shipRotation, range, leftRange);
        backCorner = LibVector.getPositionByVector(sternPosition, shipRotation, range, rightRange);
      }
      ret = new Coord[](4);
      ret[0] = position;
      ret[1] = sternPosition;
      ret[2] = backCorner;
      ret[3] = frontCorner;

      return ret;
    }
    if (cannonRotation >= 90 && cannonRotation < 270) {
      position = LibVector.getSternPosition(position, shipRotation, length);
    }
    frontCorner = LibVector.getPositionByVector(position, shipRotation, range, (cannonRotation + 10) % 360);
    backCorner = LibVector.getPositionByVector(position, shipRotation, range, (cannonRotation + 350) % 360);
    ret = new Coord[](3);
    ret[0] = position;
    ret[1] = backCorner;
    ret[2] = frontCorner;
    return ret;
  }

  /**
   * @notice  calculates if a cannon is a broadside based on its rotation
   * @param   rotation  rotation of cannon
   * @return  bool  is the ship a broadside
   */
  function isBroadside(uint256 rotation) public pure returns (bool) {
    return (rotation == 90 || rotation == 270);
  }
}
