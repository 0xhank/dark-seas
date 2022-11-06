// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

/**
 * @author  0xpectations
 * @title   MoveSystem
 * @notice  system for a player entity to change position
 */
contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, Coord memory dest) = abi.decode(arguments, (uint256, Coord));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    positionComponent.set(entity, dest);
  }

  function executeTyped(uint256 entity, Coord memory dest) public returns (bytes memory) {
    return execute(abi.encode(entity, dest));
  }
}
