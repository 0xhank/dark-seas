// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import { console } from "forge-std/console.sol";

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// Components
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";

// Types
import { Coord } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.ChangeController"));

contract ChangeControllerSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (address oldController, address newController) = abi.decode(arguments, (address, address));

    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    LastActionComponent lastActionComponent = LastActionComponent(getAddressById(components, LastActionComponentID));
    LastMoveComponent lastMoveComponent = LastMoveComponent(getAddressById(components, LastMoveComponentID));
    // create entity for player and name it
    uint256 playerEntity = addressToEntity(msg.sender);
    require(LibUtils.playerIdExists(components, playerEntity), "ChangeControllerSystem: player does not exist");

    uint256 oldControllerEntity = addressToEntity(oldController);
    require(
      ownedByComponent.getValue(oldControllerEntity) == playerEntity,
      "ChangeControllerSystem: oldController not owned by player"
    );

    uint256 newControllerEntity = addressToEntity(newController);
    if (!LibUtils.playerIdExists(components, newControllerEntity)) {
      newControllerEntity = LibSpawn.createPlayerEntity(components, newController);
    }

    lastActionComponent.set(newControllerEntity, lastActionComponent.getValue(oldControllerEntity));
    lastMoveComponent.set(newControllerEntity, lastMoveComponent.getValue(oldControllerEntity));

    ownedByComponent.remove(oldControllerEntity);
    ownedByComponent.set(newControllerEntity, playerEntity);
  }

  function executeTyped(address oldController, address newController) public returns (bytes memory) {
    return execute(abi.encode(oldController, newController));
  }
}
