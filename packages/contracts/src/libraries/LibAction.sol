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
import { ActionComponent, ID as ActionComponentID, FunctionSelector } from "../components/ActionComponent.sol";
// Types
import { Action } from "../libraries/DSTypes.sol";

// Libraries
import "./LibCombat.sol";

library LibAction {
  /**
   * @notice  executes submitted action
   * @param   components  world components
   * @param   action  set of actions to execute
   */
  function executeActions(IUint256Component components, Action memory action) public {
    // iterate through each action of each ship
    uint256 cannonEntity1;
    for (uint256 i = 0; i < 2; i++) {
      uint256 actionEntity = action.actionEntities[i];
      bytes memory metadata = action.metadata[i];
      if (actionEntity == 0) continue;
      require(
        OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(action.shipEntity) ==
          addressToEntity(msg.sender),
        "ActionSystem: you don't own this ship"
      );

      require(
        ShipComponent(getAddressById(components, ShipComponentID)).has(action.shipEntity),
        "ActionSystem: Entity must be a ship"
      );

      require(
        HealthComponent(getAddressById(components, HealthComponentID)).getValue(action.shipEntity) > 0,
        "ActionSystem: Entity is dead"
      );

      if (
        i == 1 && actionEntity != uint256(keccak256("action.fire")) && actionEntity != uint256(keccak256("action.load"))
      ) {
        require(action.actionEntities[0] != actionEntity, "ActionSystem: action already used");
      } else if (i == 1) {
        require(
          abi.decode(action.metadata[0], (uint256)) != abi.decode(action.metadata[i], (uint256)),
          "ActionSystem: cannon already acted"
        );
      }
      FunctionSelector memory functionSelector = ActionComponent(getAddressById(components, ActionComponentID))
        .getValue(actionEntity);

      (bool success, bytes memory content) = functionSelector.contr.call(
        bytes.concat(functionSelector.func, abi.encode(action.shipEntity, metadata))
      );
      require(success, "action failed");
    }

    // todo: apply damage to all ships every turn instead of only if they act
    applySpecialDamage(components, action.shipEntity);
  }

  /**
   * @notice  applies damaged mast effects
   * @param   components  world components
   * @param   shipEntity  entity to apply damage to
   */
  function applySpecialDamage(IUint256Component components, uint256 shipEntity) public {
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    // if ship has a damaged mast, reduce hull health by 1
    if (onFireComponent.has(shipEntity)) {
      LibCombat.damageHull(components, 1, shipEntity);
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
   * @notice  repairs mast on ship
   * @param   components  world components
   * @param   shipEntity  ship to repair
   */
  function repairCannons(IUint256Component components, uint256 shipEntity) public {
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
