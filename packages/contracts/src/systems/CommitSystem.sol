// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { addressToEntity } from "solecs/utils.sol";

// Components
import { CommitmentComponent, ID as CommitmentComponentID } from "../components/CommitmentComponent.sol";

// Libraries
import "../libraries/LibTurn.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Commit"));

contract CommitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 gameId, uint256 commitment) = abi.decode(arguments, (uint256, uint256));
    uint256 playerEntity = uint256(keccak256((abi.encode(gameId, addressToEntity(msg.sender)))));
    require(LibUtils.playerIdExists(world, playerEntity), "MoveSystem: player does not exist");
    require(LibTurn.getCurrentPhase(world, gameId) == Phase.Commit, "CommitSystem: incorrect turn phase");

    CommitmentComponent(LibUtils.addressById(world, CommitmentComponentID)).set(playerEntity, commitment);
  }

  function executeTyped(uint256 gameId, uint256 commitment) public returns (bytes memory) {
    return execute(abi.encode(gameId, commitment));
  }
}
