// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { Coord, Wind, Side, MoveCard } from "../libraries/DSTypes.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../components/LeakComponent.sol";
import { DamagedMastComponent, ID as DamagedMastComponentID } from "../components/DamagedMastComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";

import { console } from "forge-std/console.sol";

import "trig/src/Trigonometry.sol";
import "./LibCombat.sol";
import "./LibUtils.sol";
import "./LibVector.sol";

library LibAction {
  /**
   * @notice  applies leak and damaged mast effects
   * @param   components  world components
   * @param   entity  entity to apply damage to
   */
  function applyDamage(IUint256Component components, uint256 entity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));
    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    // if ship is leaking, reduce crew count by 1
    if (leakComponent.has(entity)) {
      uint32 crewCount = crewCountComponent.getValue(entity);
      if (crewCount <= 1) crewCountComponent.set(entity, 0);
      else crewCountComponent.set(entity, crewCount - 1);
    }

    // if ship has a damaged mast, reduce hull health by 1
    if (damagedMastComponent.has(entity)) {
      uint32 health = healthComponent.getValue(entity);
      if (health <= 1) healthComponent.set(entity, 0);
      else healthComponent.set(entity, health - 1);
    }
  }

  /**
   * @notice  attacks all enemies on given side of ship
   * @dev     todo: i plan to change this to reqiure inclusion of both an attacker and defender, saving gas and improving ux
   * @param   components  world components
   * @param   entity  entity performing an attack
   * @param   side  side of ship to attack on
   */
  function attack(
    IUint256Component components,
    uint256 entity,
    Side side
  ) public {
    if (OnFireComponent(getAddressById(components, OnFireComponentID)).has(entity)) return;
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // get firing area of ship
    Coord[4] memory firingRange = LibCombat.getFiringArea(components, entity, side);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(entity);

    // iterate through each ship, checking if it can be fired on
    // 1. is not the current ship, 2. is not owned by attacker, 3. is within firing range
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == entity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      if (LibVector.withinPolygon(firingRange, aft)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], aft);
      } else if (LibVector.withinPolygon(firingRange, stern)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], stern);
      }
    }
  }

  /**
   * @notice  raises sail if less than full sail
   * @param   components  world components
   * @param   entity  entity of which to raise sail
   */
  function raiseSail(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(entity);

    if (!(currentSailPosition > 0 && currentSailPosition < 3)) return;

    sailPositionComponent.set(entity, currentSailPosition + 1);
  }

  /**
   * @notice  lowers sail if sail higher than closed
   * @param   components  world components
   * @param   entity  entity of which to lower sail
   */
  function lowerSail(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(entity);

    if (!(currentSailPosition > 1 && currentSailPosition <= 4)) return;

    sailPositionComponent.set(entity, currentSailPosition - 1);
  }

  /**
   * @notice  extinguishes fire on ship
   * @param   components  world components
   * @param   entity  ship to extinguish
   */
  function extinguishFire(IUint256Component components, uint256 entity) public {
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    if (!onFireComponent.has(entity)) return;
    uint32 fireAmount = onFireComponent.getValue(entity);

    // it takes two actions to remove a fire from a ship
    if (fireAmount <= 1) onFireComponent.remove(entity);
    else onFireComponent.set(entity, fireAmount - 1);
  }

  /**
   * @notice  repairs leak on ship
   * @param   components  world components
   * @param   entity  ship to repair
   */
  function repairLeak(IUint256Component components, uint256 entity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    if (!leakComponent.has(entity)) return;

    leakComponent.remove(entity);
  }

  /**
   * @notice  repairs mast on ship
   * @param   components  world components
   * @param   entity  ship to repair
   */
  function repairMast(IUint256Component components, uint256 entity) public {
    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );

    if (!damagedMastComponent.has(entity)) return;
    uint32 mastDamage = damagedMastComponent.getValue(entity);

    // it takes two actions to repair a ship's mast from a ship

    if (mastDamage <= 1) damagedMastComponent.remove(entity);
    else damagedMastComponent.set(entity, mastDamage - 1);
  }

  /**
   * @notice  repairs sail on a ship
   * @param   components  world components
   * @param   entity  ship to repair
   */
  function repairSail(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    if (!sailPositionComponent.has(entity)) return;
    if (sailPositionComponent.getValue(entity) != 0) return;

    // sets the sail position back to 1
    sailPositionComponent.set(entity, 1);
  }
}
