// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import "std-contracts/components/Uint32Component.sol";

// Components
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

// Types
import { Side, Coord } from "../libraries/DSTypes.sol";

// Libraries
import "./LibVector.sol";
import "./LibUtils.sol";
import { ABDKMath64x64 as Math } from "./ABDKMath64x64.sol";

library LibCombat {
  /*************************************************** ATTACK **************************************************** */

  /**
   * @notice  attacks all enemies in forward arc of ship
   * @dev     todo: how can i combine this with attackSide despite different number of vertices in range?
   * @param   components  world components
   * @param   shipEntity  entity performing an attack
   * @param   cannonEntity  .
   */
  function attackPivot(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);
    // get firing area of ship
    Coord[3] memory firingRange = getFiringAreaPivot(components, shipEntity, cannonEntity);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(shipEntity);

    // iterate through each ship, checking if it can be fired on
    // 1. is not the current ship, 2. is not owned by attacker, 3. is within firing range
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == shipEntity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);
      uint256 distance;
      if (LibVector.withinPolygon3(firingRange, aft)) {
        distance = LibVector.distance(firingRange[0], aft);
        damageEnemy(components, shipEntity, shipEntities[i], distance, firepower);
      } else if (LibVector.withinPolygon3(firingRange, stern)) {
        distance = LibVector.distance(firingRange[0], stern);
        damageEnemy(components, shipEntity, shipEntities[i], distance, firepower);
      }
    }
  }

  /**
   * @notice  attacks all enemies on given side of ship
   * @dev     todo: i plan to change this to reqiure inclusion of both an attacker and defender, saving gas and improving ux
   * @param   components  world components
   * @param   shipEntity  entity performing an attack
   * @param   cannonEntity  .
   */
  function attackBroadside(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);

    // get firing area of ship
    Coord[4] memory firingRange = getFiringAreaBroadside(components, shipEntity, cannonEntity);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(shipEntity);

    // iterate through each ship, checking if it can be fired on
    // 1. is not the current ship, 2. is not owned by attacker, 3. is within firing range
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == shipEntity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      uint256 distance;
      if (LibVector.withinPolygon4(firingRange, aft)) {
        distance = LibVector.distance(firingRange[0], aft);
        damageEnemy(components, shipEntity, shipEntities[i], distance, firepower);
      } else if (LibVector.withinPolygon4(firingRange, stern)) {
        distance = LibVector.distance(firingRange[0], stern);
        damageEnemy(components, shipEntity, shipEntities[i], distance, firepower);
      }
    }
  }

  /**
   * @notice  damages enemy hull, and special attacks
   * @dev     cheat sheet https://tinyurl.com/ds-math
   * @param   components  world components
   * @param   attackerEntity  attacking entity
   * @param   defenderEntity  defending entity
   * @param   distance  distance between attacker and defender
   * @param   firepower  firepower of cannon firing
   */
  function damageEnemy(
    IUint256Component components,
    uint256 attackerEntity,
    uint256 defenderEntity,
    uint256 distance,
    uint32 firepower
  ) public {
    uint256 baseHitChance = getBaseHitChance(distance, firepower);

    // todo: make randomness more robust
    uint256 r = LibUtils.randomness(attackerEntity, defenderEntity);

    // perform hull damage
    uint32 hullDamage = getHullDamage(baseHitChance, r);

    bool dead = damageHull(components, hullDamage, defenderEntity);
    if (dead) return;

    if (hullDamage == 0) return;

    // perform special damage
    if (getSpecialChance(baseHitChance, hullDamage, r, 0)) {
      OnFireComponent(getAddressById(components, OnFireComponentID)).set(defenderEntity, 1);
    }
    if (getSpecialChance(baseHitChance, hullDamage, r, 1)) {
      DamagedCannonsComponent(getAddressById(components, DamagedCannonsComponentID)).set(defenderEntity, 2);
    }
    if (getSpecialChance(baseHitChance, hullDamage, r, 2)) {
      SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(defenderEntity, 0);
    }
  }

  /**
   * @notice  applies damage to hull
   * @param   components  world components
   * @param   damage  amount of damage applied
   * @param   shipEntity  to apply damage to
   * @return  bool  if the damage killed the boat
   */
  function damageHull(
    IUint256Component components,
    uint32 damage,
    uint256 shipEntity
  ) public returns (bool) {
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    uint32 health = healthComponent.getValue(shipEntity);

    if (health <= damage) {
      healthComponent.set(shipEntity, 0);
      return true;
    }

    healthComponent.set(shipEntity, health - damage);
    return false;
  }

  /*************************************************** UTILITIES **************************************************** */
  /**
   * @notice overview: increases damage as your firepower increases OR distance decreases
          equation: 50 * e^(-.008 * distance) * (firepower / 100), multiplied by 100 for precision.
          
   * @param   distance  from target
   * @param   firepower  of attacker
   * @return  hitChance  based on above equation
   */
  function getBaseHitChance(uint256 distance, uint256 firepower) public pure returns (uint256 hitChance) {
    int128 _scaleInv = Math.exp(Math.divu(distance * 8, 1000));
    int128 firepowerDebuff = Math.divu(firepower, 100);
    int128 beforeDebuff = Math.div(Math.fromUInt(5000), _scaleInv);
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
    if (odds <= (baseHitChance * 450) / 100) return 1;
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

  /**
   * @notice  calculates the location of three points comprising a triangular firing area
   * @param   components  world components
   * @param   shipEntity  attacking ship entity
   * @return  Coord[3]  points comprising firing area
   */
  function getFiringAreaPivot(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public view returns (Coord[3] memory) {
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);
    Coord memory position = PositionComponent(getAddressById(components, PositionComponentID)).getValue(shipEntity);
    uint32 shipRotation = rotationComponent.getValue(shipEntity);
    uint32 cannonRotation = rotationComponent.getValue(cannonEntity);

    if (cannonRotation >= 90 && cannonRotation < 270) {
      uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(shipEntity);
      position = LibVector.getSternLocation(position, shipRotation, length);
    }
    Coord memory frontCorner = LibVector.getPositionByVector(
      position,
      shipRotation,
      range,
      (cannonRotation + 10) % 360
    );
    Coord memory backCorner = LibVector.getPositionByVector(
      position,
      shipRotation,
      range,
      (cannonRotation + 350) % 360
    );

    return ([position, backCorner, frontCorner]);
  }

  /**
   * @notice  calculates the location of four points comprising a quadrilateral firing area
   * @dev     .
   * @param   components  world components
   * @param   shipEntity  attacking ship entity
   * @param   cannonEntity  attacking cannon entity
   * @return  Coord[4]  points comprising firing area
   */
  function getFiringAreaBroadside(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public view returns (Coord[4] memory) {
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);
    Coord memory position = PositionComponent(getAddressById(components, PositionComponentID)).getValue(shipEntity);
    uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(shipEntity);
    uint32 shipRotation = rotationComponent.getValue(shipEntity);
    uint32 cannonRotation = rotationComponent.getValue(cannonEntity);

    uint32 rightRange = (cannonRotation + 10) % 360;
    uint32 leftRange = (cannonRotation + 350) % 360;

    Coord memory sternPosition = LibVector.getSternLocation(position, shipRotation, length);

    Coord memory frontCorner;
    Coord memory backCorner;

    // if the stern is above the bow, switch the corners to ensure the quadrilateral doesn't cross in the middle
    if (cannonRotation % 360 >= 180) {
      frontCorner = LibVector.getPositionByVector(position, shipRotation, range, rightRange);
      backCorner = LibVector.getPositionByVector(sternPosition, shipRotation, range, leftRange);
    } else {
      frontCorner = LibVector.getPositionByVector(position, shipRotation, range, leftRange);
      backCorner = LibVector.getPositionByVector(sternPosition, shipRotation, range, rightRange);
    }

    return ([position, sternPosition, backCorner, frontCorner]);
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
