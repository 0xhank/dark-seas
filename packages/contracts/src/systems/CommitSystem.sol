// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById, addressToEntity } from "solecs/utils.sol";

import { CommitmentComponent, ID as CommitmentComponentID } from "../components/CommitmentComponent.sol";

import "../libraries/LibAction.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.Commit"));

contract CommitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 commitment = abi.decode(arguments, (uint256));

    uint256 playerEntity = addressToEntity(msg.sender);
    // require(LibTurn.getCurrentPhase(components) == Phase.Commit, "CommitSystem: incorrect turn phase");

    CommitmentComponent(getAddressById(components, CommitmentComponentID)).set(playerEntity, commitment);
  }

  function executeTyped(uint256 commitment) public returns (bytes memory) {
    return execute(abi.encode(commitment));
  }
}
