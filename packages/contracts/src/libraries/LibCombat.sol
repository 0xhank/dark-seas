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
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../components/MaxHealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { KillsComponent, ID as KillsComponentID } from "../components/KillsComponent.sol";
import { LastHitComponent, ID as LastHitComponentID } from "../components/LastHitComponent.sol";
import { CannonComponent, ID as CannonComponentID } from "../components/CannonComponent.sol";
import { LoadedComponent, ID as LoadedComponentID } from "../components/LoadedComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../components/BootyComponent.sol";

// Types
import { Coord } from "../libraries/DSTypes.sol";

// Libraries
import "./LibVector.sol";
import "./LibUtils.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";

library LibCombat {
  /***************************************************** LOAD **************************************************** */

  /**a
   * @notice  loads the given cannon
   * @param   components  world components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function load(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) internal {
    if (DamagedCannonsComponent(getAddressById(components, DamagedCannonsComponentID)).has(shipEntity)) return;

    require(
      CannonComponent(getAddressById(components, CannonComponentID)).has(cannonEntity),
      "load: entity not a cannon"
    );

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(cannonEntity) == shipEntity,
      "load: cannon not owned by ship"
    );

    LoadedComponent loadedComponent = LoadedComponent(getAddressById(components, LoadedComponentID));

    require(!loadedComponent.has(cannonEntity), "attack: cannon already loaded");
    loadedComponent.set(cannonEntity);
  }

  /*************************************************** ATTACK **************************************************** */
  /**
   * @notice  fires the given cannon
   * @param   components  world components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function attack(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity,
    uint256[] memory targetEntities
  ) internal {
    if (DamagedCannonsComponent(getAddressById(components, DamagedCannonsComponentID)).has(shipEntity)) return;

    require(
      CannonComponent(getAddressById(components, CannonComponentID)).has(cannonEntity),
      "attack: entity not a cannon"
    );

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(cannonEntity) == shipEntity,
      "attack: cannon not owned by ship"
    );

    LoadedComponent loadedComponent = LoadedComponent(getAddressById(components, LoadedComponentID));
    require(loadedComponent.has(cannonEntity), "attack: cannon not loaded");
    loadedComponent.remove(cannonEntity);

    if (targetEntities.length == 0) return;
    for (uint256 i = 1; i < targetEntities.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        require(targetEntities[i] != targetEntities[j], "attack: target already shot at");
      }
    }

    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    if (!isBroadside(cannonRotation)) {
      attackPivot(components, shipEntity, cannonEntity, targetEntities);
    } else {
      attackBroadside(components, shipEntity, cannonEntity, targetEntities);
    }
  }

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
    uint256 cannonEntity,
    uint256[] memory targetEntities
  ) private {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);
    uint32 kills = KillsComponent(getAddressById(components, KillsComponentID)).getValue(shipEntity);
    firepower = (firepower * (10 + kills)) / 10;

    // get firing area of ship
    Coord[3] memory firingRange = getFiringAreaPivot(components, shipEntity, cannonEntity);

    // iterate through each ship, checking if it is within firing range
    for (uint256 i = 0; i < targetEntities.length; i++) {
      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, targetEntities[i]);
      if (LibVector.withinPolygon3(firingRange, aft)) {
        uint256 distance = LibVector.distance(firingRange[0], aft);
        damageEnemy(components, shipEntity, targetEntities[i], distance, firepower);
      } else if (LibVector.withinPolygon3(firingRange, stern)) {
        uint256 distance = LibVector.distance(firingRange[0], stern);
        damageEnemy(components, shipEntity, targetEntities[i], distance, firepower);
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
    uint256 cannonEntity,
    uint256[] memory targetEntities
  ) private {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);
    uint32 kills = KillsComponent(getAddressById(components, KillsComponentID)).getValue(shipEntity);
    firepower = (firepower * (10 + kills)) / 10;

    // get firing area of ship
    Coord[4] memory firingRange = getFiringAreaBroadside(components, shipEntity, cannonEntity);

    // iterate through each ship, checking if it is within firing range
    for (uint256 i = 0; i < targetEntities.length; i++) {
      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, targetEntities[i]);

      if (LibVector.withinPolygon4(firingRange, aft)) {
        uint256 distance = LibVector.distance(firingRange[0], aft);
        damageEnemy(components, shipEntity, targetEntities[i], distance, firepower);
      } else if (LibVector.withinPolygon4(firingRange, stern)) {
        uint256 distance = LibVector.distance(firingRange[0], stern);
        damageEnemy(components, shipEntity, targetEntities[i], distance, firepower);
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

    uint256 r = LibUtils.randomness(attackerEntity, defenderEntity);

    // perform hull damage
    uint32 hullDamage = getHullDamage(baseHitChance, r);
    if (hullDamage == 0) return;

    LastHitComponent(getAddressById(components, LastHitComponentID)).set(defenderEntity, attackerEntity);
    bool dead = damageHull(components, hullDamage, defenderEntity);

    if (dead) return;

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
      uint256 attackerEntity = LastHitComponent(getAddressById(components, LastHitComponentID)).getValue(shipEntity);

      killEnemy(components, attackerEntity, shipEntity);
      return true;
    }

    healthComponent.set(shipEntity, health - damage);
    return false;
  }

  /**
   * @notice  kills enemy and rewards the attacker
   * @param   components  world components
   * @param   attackerEntity  ship that attacked
   * @param   shipEntity  ship that got killed
   */
  function killEnemy(
    IUint256Component components,
    uint256 attackerEntity,
    uint256 shipEntity
  ) private {
    KillsComponent killsComponent = KillsComponent(getAddressById(components, KillsComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    LengthComponent lengthComponent = LengthComponent(getAddressById(components, LengthComponentID));

    healthComponent.set(shipEntity, 0);

    // update ship kills
    uint32 prevKills = killsComponent.getValue(attackerEntity);
    killsComponent.set(attackerEntity, prevKills + 1);

    // update ship length
    uint32 prevLength = lengthComponent.getValue(attackerEntity);
    lengthComponent.set(attackerEntity, prevLength + 2);

    // remove booty from sunk ship -> add half to attacking ship and half to attacking player
    uint256 booty = bootyComponent.getValue(shipEntity);
    bootyComponent.set(shipEntity, 0);
    uint256 oldBooty = bootyComponent.getValue(attackerEntity);
    bootyComponent.set(attackerEntity, oldBooty + booty / 2);
    uint256 ownerEntity = OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(attackerEntity);
    oldBooty = bootyComponent.getValue(ownerEntity);
    bootyComponent.set(ownerEntity, oldBooty + booty / 2);

    uint32 maxHealth = MaxHealthComponent(getAddressById(components, MaxHealthComponentID)).getValue(attackerEntity);
    uint32 health = healthComponent.getValue(attackerEntity);
    if (health + 1 >= maxHealth) healthComponent.set(attackerEntity, maxHealth);
    else healthComponent.set(attackerEntity, health + 1);
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
