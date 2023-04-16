// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { console } from "forge-std/console.sol";

// Components
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { OwnerOfComponent, ID as OwnerOfComponentID } from "../components/OwnerOfComponent.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

// Types
import { ShipPrototype, GodID } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.SpawnPlayer"));

contract SpawnPlayerSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));
    require(bytes(name).length > 0, "SpawnPlayerSystem: name is blank");
    console.log("spawn player sender:", addressToEntity(msg.sender));
    OwnedByComponent ownedByComponent = OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID));
    uint256 ownerEntity = addressToEntity(msg.sender);
    require(!LibUtils.playerIdExists(world, ownerEntity), "SpawnPlayerSystem: player has already spawned");

    NameComponent(LibUtils.addressById(world, NameComponentID)).set(ownerEntity, name);
    PlayerComponent(LibUtils.addressById(world, PlayerComponentID)).set(ownerEntity);

    uint256[] memory defaultShipPrototypeEntities = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID))
      .getValue(GodID);

    for (uint256 i = 0; i < defaultShipPrototypeEntities.length; i++) {
      LibSpawn.initializeShip(world, defaultShipPrototypeEntities[i]);
    }
  }

  function executeTyped(string calldata name) public returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
