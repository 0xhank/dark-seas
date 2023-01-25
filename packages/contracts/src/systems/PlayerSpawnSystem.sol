// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// Components
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

// Types
import { Coord } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.PlayerSpawn"));

contract PlayerSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(!LibUtils.playerAddrExists(components, msg.sender), "PlayerSpawnSystem: player has already spawned");

    (address controller, string memory name, Coord memory location) = abi.decode(arguments, (address, string, Coord));
    require(bytes(name).length > 0, "PlayerSpawnSystem: name is blank");

    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    // create entity for player and name it
    uint256 playerEntity = LibSpawn.createPlayerEntity(components, msg.sender);

    uint256 controllerEntity = playerEntity;
    if (msg.sender != controller) controllerEntity = LibSpawn.createPlayerEntity(components, controller);

    ownedByComponent.set(controllerEntity, playerEntity);
    NameComponent(getAddressById(components, NameComponentID)).set(playerEntity, name);

    LibSpawn.spawn(world, components, playerEntity, location);
  }

  function executeTyped(
    address controller,
    string calldata name,
    Coord calldata location
  ) public returns (bytes memory) {
    return execute(abi.encode(controller, name, location));
  }
}
