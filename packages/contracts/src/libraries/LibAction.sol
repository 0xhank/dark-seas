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
// Types
import { Action, ActionType } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";
import "./LibUtils.sol";

library LibAction {
  /**
   * @notice  executes submitted action
   * @param   components  world components
   * @param   action  set of actions to execute
   */
  function executeActions(
    IUint256Component components,
    Action memory action,
    uint256 playerEntity
  ) public {
    // iterate through each action of each ship
    uint256 cannonEntity1;
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    for (uint256 i = 0; i < 2; i++) {
      ActionType actionType = action.actionTypes[i];
      bytes memory metadata = action.metadata[i];
      if (actionType == ActionType.None) continue;
      require(ownedByComponent.getValue(action.shipEntity) == playerEntity, "ActionSystem: you don't own this ship");

      require(
        ShipComponent(getAddressById(components, ShipComponentID)).has(action.shipEntity),
        "ActionSystem: Entity must be a ship"
      );

      require(
        HealthComponent(getAddressById(components, HealthComponentID)).getValue(action.shipEntity) > 0,
        "ActionSystem: Entity is dead"
      );

      // todo: fix ensure action hasn't already been made
      if (i == 1 && actionType != ActionType.Fire && actionType != ActionType.Load) {
        require(action.actionTypes[0] != actionType, "ActionSystem: action already used");
      }
      if (actionType == ActionType.Load) {
        uint256 cannonEntity = abi.decode(metadata, (uint256));
        if (i == 0) cannonEntity1 = cannonEntity;
        else require(cannonEntity != cannonEntity1, "ActionSystem: cannon already acted");

        LibCombat.load(components, action.shipEntity, cannonEntity);
      } else if (actionType == ActionType.Fire) {
        (uint256 cannonEntity, uint256[] memory targetEntities) = abi.decode(metadata, (uint256, uint256[]));
        if (i == 0) cannonEntity1 = cannonEntity;
        else require(cannonEntity != cannonEntity1, "ActionSystem: cannon already acted");
        LibCombat.attack(components, action.shipEntity, cannonEntity, targetEntities);
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
      if (health == 0) return;
      else if (health == 1) {
        healthComponent.set(shipEntity, 0);

        LastHitComponent lastHitComponent = LastHitComponent(getAddressById(components, LastHitComponentID));
        if (!lastHitComponent.has(shipEntity)) return;
        uint256 lastAttacker = lastHitComponent.getValue(shipEntity);

        KillsComponent killsComponent = KillsComponent(getAddressById(components, KillsComponentID));

        uint32 prevKills = killsComponent.getValue(lastAttacker);
        killsComponent.set(lastAttacker, prevKills + 1);
      } else healthComponent.set(shipEntity, health - 1);
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
