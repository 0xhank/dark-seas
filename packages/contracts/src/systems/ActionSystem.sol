// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";

import { Coord, Action } from "../libraries/DSTypes.sol";

import "../libraries/LibVector.sol";
import "../libraries/LibCombat.sol";
import "../libraries/LibUtils.sol";
import "../libraries/LibAction.sol";

uint256 constant ID = uint256(keccak256("ds.system.Action"));

contract ActionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (Action[] memory actions, uint256 shipEntity) = abi.decode(arguments, (Action[], uint256));

    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(shipEntity),
      "ChangeSailSystem: Entity must be a ship"
    );

    for (uint256 i = 0; i < actions.length; i++) {
      Action action = actions[i];
      if (action == Action.FireRight) {
        LibAction.attack(components, shipEntity, Side.Right);
      } else if (action == Action.FireLeft) {
        LibAction.attack(components, shipEntity, Side.Left);
      } else if (action == Action.RaiseSail) {
        LibAction.raiseSail(components, shipEntity);
      } else if (action == Action.LowerSail) {
        LibAction.lowerSail(components, shipEntity);
      } else if (action == Action.ExtinguishFire) {
        LibAction.extinguishFire(components, shipEntity);
      } else if (action == Action.RepairLeak) {
        LibAction.repairLeak(components, shipEntity);
      } else if (action == Action.RepairMast) {
        LibAction.repairMast(components, shipEntity);
      } else if (action == Action.RepairSail) {
        LibAction.repairSail(components, shipEntity);
      } else {
        revert("ActionSystem: invalid action");
      }
    }
  }

  function executeTyped(Action[] calldata actions, uint256 shipEntity) public returns (bytes memory) {
    return execute(abi.encode(actions, shipEntity));
  }
}