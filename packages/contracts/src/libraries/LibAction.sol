// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { CannonComponent, ID as CannonComponentID } from "../components/CannonComponent.sol";
import { LoadedComponent, ID as LoadedComponentID } from "../components/LoadedComponent.sol";

// Types
import { Coord, Side, Action, ActionType } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";
import "./LibUtils.sol";
import "./LibVector.sol";

library LibAction {
  /**
   * @notice  executes all actions corresponding to the input action
   * @param   components  world components
   * @param   action  set of actions to execute
   */
  function executeActions(IUint256Component components, Action memory action) public {
    // iterate through each action of each ship
    for (uint256 i = 0; i < 2; i++) {
      ActionType actionType = action.actionTypes[i];
      uint256 specialEntity = action.specialEntities[i];
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
        if (actionType == ActionType.Fire || actionType == ActionType.Load)
          require(specialEntity != action.specialEntities[0], "ActionSystem: cannon already acted");
        else require(action.actionTypes[0] != actionType, "ActionSystem: action already used");
      }
      if (actionType == ActionType.Load) {
        load(components, action.shipEntity, specialEntity);
      } else if (actionType == ActionType.Fire) {
        attack(components, action.shipEntity, specialEntity);
      } else if (actionType == ActionType.RaiseSail) {
        raiseSail(components, action.shipEntity);
      } else if (actionType == ActionType.LowerSail) {
        lowerSail(components, action.shipEntity);
      } else if (actionType == ActionType.ExtinguishFire) {
        extinguishFire(components, action.shipEntity);
      } else if (actionType == ActionType.RepairCannons) {
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
   * @notice  applies damaged mast effects
   * @param   components  world components
   * @param   shipEntity  entity to apply damage to
   */
  function applySpecialDamage(IUint256Component components, uint256 shipEntity) private {
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    // if ship has a damaged mast, reduce hull health by 1
    if (onFireComponent.has(shipEntity)) {
      uint32 health = healthComponent.getValue(shipEntity);
      if (health <= 1) healthComponent.set(shipEntity, 0);
      else healthComponent.set(shipEntity, health - 1);
    }
  }

  /**
   * @notice  loads the given cannon
   * @param   components  world components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function load(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) private {
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

  /**
   * @notice  fires the given cannon
   * @param   components  world components
   * @param   shipEntity  ship controlling cannon
   * @param   cannonEntity  cannon to load
   */
  function attack(
    IUint256Component components,
    uint256 shipEntity,
    uint256 cannonEntity
  ) public {
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
    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    if (!LibCombat.isBroadside(cannonRotation)) {
      LibCombat.attackPivot(components, shipEntity, cannonEntity);
    } else {
      LibCombat.attackBroadside(components, shipEntity, cannonEntity);
    }
    loadedComponent.remove(cannonEntity);
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
   * @notice  repairs mast on ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairMast(IUint256Component components, uint256 shipEntity) private {
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      getAddressById(components, DamagedCannonsComponentID)
    );

    if (!damagedCannonsComponent.has(shipEntity)) return;
    uint32 mastDamage = damagedCannonsComponent.getValue(shipEntity);

    // it takes two actions to repair a ship's mast from a ship

    if (mastDamage <= 1) damagedCannonsComponent.remove(shipEntity);
    else damagedCannonsComponent.set(shipEntity, mastDamage - 1);
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
