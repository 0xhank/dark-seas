// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import "solecs/System.sol";

// Components
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { ActionComponent, ID as ActionComponentID, FunctionSelector } from "../components/ActionComponent.sol";
import { ActionSystem, ID as ActionSystemID } from "../systems/ActionSystem.sol";
// Types
import { MoveCard, GameConfig, ShipPrototype, CannonPrototype, Coord } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.CreateGame"));

import "../libraries/LibCreateShip.sol";
import "../libraries/LibUtils.sol";
import "../libraries/LibCrate.sol";

contract CreateGameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 gameId = world.getUniqueEntityId();
    GameConfig memory gameConfig = abi.decode(arguments, (GameConfig));
    if (gameConfig.startTime == 0) {
      gameConfig.startTime = block.timestamp;
    }
    GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).set(gameId, gameConfig);

    return abi.encode(gameId);
  }

  function executeTyped(GameConfig calldata gameConfig) public returns (bytes memory) {
    return execute(abi.encode(gameConfig));
  }
}
