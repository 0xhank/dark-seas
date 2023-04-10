// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
// Components
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";

// Types
import { Coord, GameConfig } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibTurn.sol";

uint256 constant ID = uint256(keccak256("ds.system.ExtractShip"));

contract ExtractShipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 shipEntity = abi.decode(arguments, (uint256));
    require(
      OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(shipEntity) ==
        addressToEntity(msg.sender),
      "ExtractShipSystem: you don't own this ship"
    );
    CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).remove(shipEntity);
  }

  function executeTyped(uint256 shipEntity) public returns (bytes memory) {
    return execute(abi.encode(shipEntity));
  }

  function bulkExtract(uint256[] memory shipEntities) public returns (bytes memory) {
    for (uint i = 0; i < shipEntities.length; i++) {
      execute(abi.encode(shipEntities[i]));
    }
    return new bytes(0);
  }
}
