// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getSystemAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { CommitmentComponent, ID as CommitmentComponentID } from "../components/CommitmentComponent.sol";

import { Phase, Move } from "../libraries/DSTypes.sol";
import "../libraries/LibMove.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 gameId, Move[] memory moves) = abi.decode(arguments, (uint256, Move[]));
    uint256 playerEntity = addressToEntity(msg.sender);
    require(
      uint256(keccak256(arguments)) ==
        CommitmentComponent(LibUtils.addressById(world, CommitmentComponentID)).getValue(playerEntity),
      "MoveSystem: commitment doesn't match move"
    );

    require(
      LibTurn.getCurrentPhase(world, gameId) != Phase.Action,
      "MoveSystem: cannot complete move during Action phase"
    );

    require(LibUtils.playerIdExists(world, playerEntity), "MoveSystem: player does not exist");

    LastMoveComponent lastMoveComponent = LastMoveComponent(LibUtils.addressById(world, LastMoveComponentID));

    uint32 currentTurn = LibTurn.getCurrentTurn(world, gameId);
    require(lastMoveComponent.getValue(playerEntity) < currentTurn, "MoveSystem: already moved this turn");

    // iterate through each ship entity
    for (uint256 i = 0; i < moves.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        require(moves[i].shipEntity != moves[j].shipEntity, "MoveSystem: ship already moved");
      }
      LibMove.moveShip(world, gameId, moves[i], playerEntity);
    }

    lastMoveComponent.set(playerEntity, currentTurn);
  }

  function executeTyped(uint256 gameId, Move[] calldata moves, uint256 salt) public returns (bytes memory) {
    return execute(abi.encode(gameId, moves, salt));
  }
}
