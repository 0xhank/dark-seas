// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.ShipSpawn"));

contract ShipSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (Coord memory location, uint32 rotation) = abi.decode(arguments, (Coord, uint32));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint256 entity = world.getUniqueEntityId();

    positionComponent.set(entity, location);
    rotationComponent.set(entity, rotation);

    return abi.encode(entity);
  }

  function executeTyped(Coord memory location, uint32 rotation) public returns (uint256) {
    return abi.decode(execute(abi.encode(location, rotation)), (uint256));
  }
}
