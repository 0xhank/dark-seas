// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../components/LeakComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.RepairLeak"));

contract RepairLeakSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 entityId = abi.decode(arguments, (uint256));
    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    require(shipComponent.has(entityId), "RepairLeakSystem: entity is not a ship");
    require(leakComponent.has(entityId), "RepairLeakSystem: entity does not have a leak");

    leakComponent.remove(entityId);
  }

  function executeTyped(uint256 entityId) public returns (bytes memory) {
    return execute(abi.encode(entityId));
  }
}
