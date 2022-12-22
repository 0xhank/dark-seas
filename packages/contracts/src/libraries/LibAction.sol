// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../components/LeakComponent.sol";
import { DamagedMastComponent, ID as DamagedMastComponentID } from "../components/DamagedMastComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";

// Types
import { Coord, Side, Action } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";
import "./LibUtils.sol";
import "./LibVector.sol";

library LibAction {
  function executeShipActions(
    IUint256Component components,
    uint256 shipEntity,
    Action[] memory shipActions
  ) public {
    require(shipActions.length <= 2, "ActionSystem: too many actions");

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(shipEntity) ==
        addressToEntity(msg.sender),
      "ActionSystem: you don't own this ship"
    );

    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(shipEntity),
      "ActionSystem: Entity must be a ship"
    );

    // iterate through each action of each ship
    for (uint256 j = 0; j < shipActions.length; j++) {
      Action action = shipActions[j];

      // ensure action hasn't already been made
      if (j == 1) {
        require(shipActions[0] != action, "ActionSystem: action already used");
      }

      // execute action
      if (action == Action.FireForward) {
        attackForward(components, shipEntity);
      } else if (action == Action.FireRight) {
        attackSide(components, shipEntity, Side.Right);
      } else if (action == Action.FireLeft) {
        attackSide(components, shipEntity, Side.Left);
      } else if (action == Action.RaiseSail) {
        raiseSail(components, shipEntity);
      } else if (action == Action.LowerSail) {
        lowerSail(components, shipEntity);
      } else if (action == Action.ExtinguishFire) {
        extinguishFire(components, shipEntity);
      } else if (action == Action.RepairLeak) {
        repairLeak(components, shipEntity);
      } else if (action == Action.RepairMast) {
        repairMast(components, shipEntity);
      } else if (action == Action.RepairSail) {
        repairSail(components, shipEntity);
      } else {
        revert("ActionSystem: invalid action");
      }
    }

    // todo: apply damage to all ships every turn instead of only if they act
    applySpecialDamage(components, shipEntity);
  }

  /**
   * @notice  applies leak and damaged mast effects
   * @param   components  world components
   * @param   shipEntity  entity to apply damage to
   */
  function applySpecialDamage(IUint256Component components, uint256 shipEntity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));
    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    // if ship is leaking, reduce crew count by 1
    if (leakComponent.has(shipEntity)) {
      uint32 crewCount = crewCountComponent.getValue(shipEntity);
      if (crewCount <= 1) crewCountComponent.set(shipEntity, 0);
      else crewCountComponent.set(shipEntity, crewCount - 1);
    }

    // if ship has a damaged mast, reduce hull health by 1
    if (damagedMastComponent.has(shipEntity)) {
      uint32 health = healthComponent.getValue(shipEntity);
      if (health <= 1) healthComponent.set(shipEntity, 0);
      else healthComponent.set(shipEntity, health - 1);
    }
  }

  /**
   * @notice  attacks all enemies in forward arc of ship
   * @dev     todo: how can i combine this with attackSide despite different number of vertices in range?
   * @param   components  world components
   * @param   shipEntity  entity performing an attack
   */
  function attackForward(IUint256Component components, uint256 shipEntity) private {
    if (OnFireComponent(getAddressById(components, OnFireComponentID)).has(shipEntity)) return;
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // get firing area of ship
    Coord[3] memory firingRange = LibCombat.getFiringAreaForward(components, shipEntity);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(shipEntity);

    // iterate through each ship, checking if it can be fired on
    // 1. is not the current ship, 2. is not owned by attacker, 3. is within firing range
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == shipEntity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      if (LibVector.withinPolygon3(firingRange, aft)) {
        LibCombat.damageEnemy(components, shipEntity, shipEntities[i], aft);
      } else if (LibVector.withinPolygon3(firingRange, stern)) {
        LibCombat.damageEnemy(components, shipEntity, shipEntities[i], stern);
      }
    }
  }

  /**
   * @notice  attacks all enemies on given side of ship
   * @dev     todo: i plan to change this to reqiure inclusion of both an attacker and defender, saving gas and improving ux
   * @param   components  world components
   * @param   shipEntity  entity performing an attack
   * @param   side  side of ship to attack on
   */
  function attackSide(
    IUint256Component components,
    uint256 shipEntity,
    Side side
  ) public {
    if (OnFireComponent(getAddressById(components, OnFireComponentID)).has(shipEntity)) return;
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // get firing area of ship
    Coord[4] memory firingRange = LibCombat.getFiringAreaSide(components, shipEntity, side);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(shipEntity);

    // iterate through each ship, checking if it can be fired on
    // 1. is not the current ship, 2. is not owned by attacker, 3. is within firing range
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == shipEntity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      if (LibVector.withinPolygon4(firingRange, aft)) {
        LibCombat.damageEnemy(components, shipEntity, shipEntities[i], aft);
      } else if (LibVector.withinPolygon4(firingRange, stern)) {
        LibCombat.damageEnemy(components, shipEntity, shipEntities[i], stern);
      }
    }
  }

  /**
   * @notice  raises sail if less than full sail
   * @param   components  world components
   * @param   shipEntity  entity of which to raise sail
   */
  function raiseSail(IUint256Component components, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(shipEntity);

    if (currentSailPosition != 1) return;

    sailPositionComponent.set(shipEntity, currentSailPosition + 1);
  }

  /**
   * @notice  lowers sail if sail higher than closed
   * @param   components  world components
   * @param   shipEntity  entity of which to lower sail
   */
  function lowerSail(IUint256Component components, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(shipEntity);

    if (currentSailPosition != 2) return;

    sailPositionComponent.set(shipEntity, currentSailPosition - 1);
  }

  /**
   * @notice  extinguishes fire on ship
   * @param   components  world components
   * @param   shipEntity  ship to extinguish
   */
  function extinguishFire(IUint256Component components, uint256 shipEntity) public {
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    if (!onFireComponent.has(shipEntity)) return;
    uint32 fireAmount = onFireComponent.getValue(shipEntity);

    // it takes two actions to remove a fire from a ship
    if (fireAmount <= 1) onFireComponent.remove(shipEntity);
    else onFireComponent.set(shipEntity, fireAmount - 1);
  }

  /**
   * @notice  repairs leak on ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairLeak(IUint256Component components, uint256 shipEntity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    if (!leakComponent.has(shipEntity)) return;

    leakComponent.remove(shipEntity);
  }

  /**
   * @notice  repairs mast on ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairMast(IUint256Component components, uint256 shipEntity) public {
    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );

    if (!damagedMastComponent.has(shipEntity)) return;
    uint32 mastDamage = damagedMastComponent.getValue(shipEntity);

    // it takes two actions to repair a ship's mast from a ship

    if (mastDamage <= 1) damagedMastComponent.remove(shipEntity);
    else damagedMastComponent.set(shipEntity, mastDamage - 1);
  }

  /**
   * @notice  repairs sail on a ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairSail(IUint256Component components, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    if (!sailPositionComponent.has(shipEntity)) return;
    if (sailPositionComponent.getValue(shipEntity) != 0) return;

    // sets the sail position back to 1
    sailPositionComponent.set(shipEntity, 1);
  }
}
