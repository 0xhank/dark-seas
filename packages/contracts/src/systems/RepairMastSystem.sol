// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.RepairMast"));

contract RepairMastSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 entityId = abi.decode(arguments, (uint256));

    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    require(shipComponent.has(entityId), "RepairMastSystem: entity is not a ship");
    require(sailPositionComponent.has(entityId), "RepairMastSystem: entity sails are not broken");
    require(sailPositionComponent.getValue(entityId) == 0, "RepairMastSystem: entity sails are not broken");

    sailPositionComponent.set(entityId, 1);
  }

  function executeTyped(uint256 entityId) public returns (bytes memory) {
    return execute(abi.encode(entityId));
  }
}
