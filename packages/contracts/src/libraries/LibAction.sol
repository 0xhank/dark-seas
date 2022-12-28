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
import { Coord, Side, Action, ActionType } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";
import "./LibUtils.sol";
import "./LibVector.sol";

library LibAction {
  function executeActions(IUint256Component components, Action memory action) public {
    // iterate through each action of each ship
    for (uint256 i = 0; i < 2; i++) {
      ActionType actionType = action.actionType[i];
      bytes memory metadata = action.metadata[i];
      if (actionType == ActionType.None) continue;
      require(
        OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(action.shipEntity) ==
          addressToEntity(msg.sender),
        "ActionSystem: you don't own this ship"
      );

      require(
        ShipComponent(getAddressById(components, ShipComponentID)).has(action.shipEntity),
        "ActionSystem: Entity must be a ship"
      );

      // ensure action hasn't already been made
      if (i == 1) {
        require(action.actionType[0] != actionType, "ActionSystem: action already used");
      }
      if (actionType == ActionType.Load) {
        load(components, action.shipEntity, metadata);
      } else if (actionType == ActionType.Fire) {
        attack(components, action.shipEntity, metadata);
      } else if (actionType == ActionType.RaiseSail) {
        raiseSail(components, action.shipEntity);
      } else if (actionType == ActionType.LowerSail) {
        lowerSail(components, action.shipEntity);
      } else if (actionType == ActionType.ExtinguishFire) {
        extinguishFire(components, action.shipEntity);
      } else if (actionType == ActionType.RepairLeak) {
        repairLeak(components, action.shipEntity);
      } else if (actionType == ActionType.RepairMast) {
        repairMast(components, action.shipEntity);
      } else if (actionType == ActionType.RepairSail) {
        repairSail(components, action.shipEntity);
      } else {
        revert("ActionSystem: invalid action");
      }
    }

    // todo: apply damage to all ships every turn instead of only if they act
    applySpecialDamage(components, action.shipEntity);
  }

  /**
   * @notice  applies leak and damaged mast effects
   * @param   components  world components
   * @param   shipEntity  entity to apply damage to
   */
  function applySpecialDamage(IUint256Component components, uint256 shipEntity) private {
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

  function load(
    IUint256Component components,
    uint256 shipEntity,
    bytes memory metadata
  ) private {}

  function attack(
    IUint256Component components,
    uint256 shipEntity,
    bytes memory metadata
  ) public {
    uint256 cannonEntity = abi.decode(metadata, (uint256));
    if (OnFireComponent(getAddressById(components, OnFireComponentID)).has(shipEntity)) return;

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(cannonEntity) == shipEntity,
      "attack: cannon not owned by ship"
    );
    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    if (LibCombat.isBroadside(cannonRotation)) {
      attackPivot(components, shipEntity, cannonEntity);
    } else {
      attackBroadside(components, shipEntity, cannonEntity);
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
    uint256 cannonEntity
  ) public {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // get firing area of ship
    Coord[3] memory firingRange = LibCombat.getFiringAreaPivot(components, shipEntity, cannonEntity);

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
   * @param   cannonEntity  .
   */
  function attackBroadside(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    // get firing area of ship
    Coord[4] memory firingRange = LibCombat.getFiringAreaBroadside(components, shipEntity, cannonEntity);

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
  function raiseSail(IUint256Component components, uint256 shipEntity) private {
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
  function lowerSail(IUint256Component components, uint256 shipEntity) private {
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
  function extinguishFire(IUint256Component components, uint256 shipEntity) private {
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
  function repairLeak(IUint256Component components, uint256 shipEntity) private {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    if (!leakComponent.has(shipEntity)) return;

    leakComponent.remove(shipEntity);
  }

  /**
   * @notice  repairs mast on ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairMast(IUint256Component components, uint256 shipEntity) private {
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
  function repairSail(IUint256Component components, uint256 shipEntity) private {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    if (!sailPositionComponent.has(shipEntity)) return;
    if (sailPositionComponent.getValue(shipEntity) != 0) return;

    // sets the sail position back to 1
    sailPositionComponent.set(shipEntity, 1);
  }
}
