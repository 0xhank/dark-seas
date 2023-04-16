// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";
import { ActionComponent, ID as ActionComponentID, FunctionSelector } from "../components/ActionComponent.sol";
// Types
import { Action } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";
import "./LibUtils.sol";

library LibAction {
  /**
   * @notice  executes submitted action
   * @param   world world and components * @param   action  set of actions to execute
   */
  /**
   * @notice  .
   * @dev     .
   * @param   world  .
   * @param   gameId  .
   * @param   action  .
   */
  function executeActions(IWorld world, uint256 gameId, Action memory action) public {
    // iterate through each action of each ship
    ActionComponent actionComponent = ActionComponent(LibUtils.addressById(world, ActionComponentID));
    for (uint256 i = 0; i < 2; i++) {
      bytes memory actionId = action.actions[i];
      uint256 actionHash = uint256(keccak256(actionId));
      bytes memory metadata = action.metadata[i];
      if (!actionComponent.has(actionHash)) continue;
      require(
        CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).getValue(action.shipEntity) == gameId,
        "ActionSystem: you don't own this ship"
      );
      require(
        OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(action.shipEntity) ==
          addressToEntity(msg.sender),
        "ActionSystem: you don't own this ship"
      );

      require(
        ShipComponent(LibUtils.addressById(world, ShipComponentID)).has(action.shipEntity),
        "ActionSystem: Entity must be a ship"
      );

      require(
        HealthComponent(LibUtils.addressById(world, HealthComponentID)).getValue(action.shipEntity) > 0,
        "ActionSystem: Entity is dead"
      );
      if (i == 1) {
        if (actionHash != uint256(keccak256("action.fire")) && actionHash != uint256(keccak256("action.load"))) {
          require(uint256(keccak256(action.actions[0])) != actionHash, "ActionSystem: action already used");
        } else {
          require(
            abi.decode(action.metadata[0], (uint256)) != abi.decode(action.metadata[i], (uint256)),
            "ActionSystem: cannon already acted"
          );
        }
      }
      FunctionSelector memory functionSelector = ActionComponent(LibUtils.addressById(world, ActionComponentID))
        .getValue(actionHash);

      (bool success, bytes memory result) = functionSelector.contr.call(
        bytes.concat(functionSelector.func, abi.encode(action.shipEntity, metadata))
      );
      if (!success) {
        assembly {
          revert(add(result, 32), mload(result))
        }
      }
    }

    // todo: apply damage to all ships every turn instead of only if they act
    applySpecialDamage(world, action.shipEntity);
  }

  /**
   * @notice  applies damaged mast effects
   * @param   world world and components
   * @param   shipEntity  entity to apply damage to
   */
  function applySpecialDamage(IWorld world, uint256 shipEntity) public {
    OnFireComponent onFireComponent = OnFireComponent(LibUtils.addressById(world, OnFireComponentID));

    // if ship has a damaged mast, reduce hull health by 1
    if (onFireComponent.has(shipEntity)) {
      LibCombat.damageHull(world, 1, shipEntity);
    }
  }

  /**
   * @notice  raises sail if less than full sail
   * @param   world world and components
   * @param   shipEntity  entity of which to raise sail
   */
  function raiseSail(IWorld world, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      LibUtils.addressById(world, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(shipEntity);

    if (currentSailPosition != 1) return;

    sailPositionComponent.set(shipEntity, currentSailPosition + 1);
  }

  /**
   * @notice  lowers sail if sail higher than closed
   * @param   world world and components
   * @param   shipEntity  entity of which to lower sail
   */
  function lowerSail(IWorld world, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      LibUtils.addressById(world, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(shipEntity);

    if (currentSailPosition != 2) return;

    sailPositionComponent.set(shipEntity, currentSailPosition - 1);
  }

  /**
   * @notice  extinguishes fire on ship
   * @param   world world and components
   * @param   shipEntity  ship to extinguish
   */
  function extinguishFire(IWorld world, uint256 shipEntity) public {
    OnFireComponent onFireComponent = OnFireComponent(LibUtils.addressById(world, OnFireComponentID));

    if (!onFireComponent.has(shipEntity)) return;
    uint32 fireAmount = onFireComponent.getValue(shipEntity);

    // it takes two actions to remove a fire from a ship
    if (fireAmount <= 1) onFireComponent.remove(shipEntity);
    else onFireComponent.set(shipEntity, fireAmount - 1);
  }

  /**
   * @notice  repairs mast on ship
   * @param   world world and components
   * @param   shipEntity  ship to repair
   */
  function repairCannons(IWorld world, uint256 shipEntity) public {
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      LibUtils.addressById(world, DamagedCannonsComponentID)
    );

    if (!damagedCannonsComponent.has(shipEntity)) return;
    uint32 mastDamage = damagedCannonsComponent.getValue(shipEntity);

    // it takes two actions to repair a ship's mast from a ship

    if (mastDamage <= 1) damagedCannonsComponent.remove(shipEntity);
    else damagedCannonsComponent.set(shipEntity, mastDamage - 1);
  }

  /**
   * @notice  repairs sail on a ship
   * @param   world world and components
   * @param   shipEntity  ship to repair
   */
  function repairSail(IWorld world, uint256 shipEntity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      LibUtils.addressById(world, SailPositionComponentID)
    );

    if (!sailPositionComponent.has(shipEntity)) return;
    if (sailPositionComponent.getValue(shipEntity) != 0) return;

    // sets the sail position back to 1
    sailPositionComponent.set(shipEntity, 1);
  }
}
