// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";

import { getAddressById, addressToEntity, getSystemAddressById } from "solecs/utils.sol";

import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

import { GameConfig, GodID, Coord } from "../libraries/DSTypes.sol";

import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { PlayerComponent, ID as PlayerComponentID } from "../components/PlayerComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.PlayerSpawn"));

contract PlayerSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(!LibSpawn.playerAddrExists(components, msg.sender), "PlayerSpawnSystem: player has already spawned");

    (string memory name, Coord memory location) = abi.decode(arguments, (string, Coord));
    require(bytes(name).length > 0, "PlayerSpawnSystem: name is blank");

    // create entity for player and name it
    uint256 playerEntity = LibSpawn.createPlayerEntity(components, msg.sender);
    NameComponent(getAddressById(components, NameComponentID)).set(playerEntity, name);

    LibSpawn.spawn(world, components, playerEntity, location);
  }

  function executeTyped(string calldata name, Coord calldata location) public returns (bytes memory) {
    return execute(abi.encode(name, location));
  }
}
