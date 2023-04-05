// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";

// Components
import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";

// Libraries
import "../libraries/LibUtils.sol";

// Types
import { ShipPrototype, GodID } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.SpawnPlayer"));

contract SpawnPlayerSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));
    require(bytes(name).length > 0, "SpawnPlayerSystem: name is blank");

    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );
    OwnedByComponent ownedByComponent = OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID));
    uint256 ownerEntity = addressToEntity(msg.sender);
    require(!LibUtils.playerIdExists(world, ownerEntity), "SpawnPlayerSystem: player has already spawned");

    NameComponent(LibUtils.addressById(world, NameComponentID)).set(ownerEntity, name);
    PlayerComponent(LibUtils.addressById(world, PlayerComponentID)).set(ownerEntity);

    string memory encodedDefaultShipPrototypeEntities = shipPrototypeComponent.getValue(GodID);

    uint256[] memory defaultShipPrototypeEntities = abi.decode(bytes(encodedDefaultShipPrototypeEntities), (uint256[]));

    for (uint256 i = 0; i < defaultShipPrototypeEntities.length; i++) {
      uint256 shipPrototypeEntity = world.getUniqueEntityId();
      string memory shipPrototype = shipPrototypeComponent.getValue(defaultShipPrototypeEntities[i]);

      shipPrototypeComponent.set(shipPrototypeEntity, shipPrototype);
      ownedByComponent.set(shipPrototypeEntity, ownerEntity);
    }
  }

  function executeTyped(string calldata name) public returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
