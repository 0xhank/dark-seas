// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
uint256 constant ID = uint256(keccak256("ds.system.RepairMast"));

contract RepairMastSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 rotation, uint32 length, uint32 range) = abi.decode(arguments, (uint32, uint32, uint32));
  }

  function executeTyped(
    uint32 rotation,
    uint32 length,
    uint32 range
  ) public returns (bytes memory) {
    return execute(abi.encode(rotation, length, range));
  }
}
