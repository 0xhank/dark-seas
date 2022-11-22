// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.ExtinguishFire"));

contract ExtinguishFireSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 entityId = abi.decode(arguments, (uint256));

    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    require(shipComponent.has(entityId), "RepairOnFireSystem: entity is not a ship");
    require(onFireComponent.has(entityId), "RepairOnFireSystem: entity is not on fire");

    onFireComponent.remove(entityId);
  }

  function executeTyped(uint256 entityId) public returns (bytes memory) {
    return execute(abi.encode(entityId));
  }
}
