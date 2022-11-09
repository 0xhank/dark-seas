// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { WidthComponent, ID as WidthComponentID } from "../components/WidthComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.ShipSpawn"));

contract ShipSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (Coord memory location, uint32 rotation, uint32 length, uint32 width) = abi.decode(
      arguments,
      (Coord, uint32, uint32, uint32)
    );
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    LengthComponent lengthComponent = LengthComponent(getAddressById(components, LengthComponentID));
    WidthComponent widthComponent = WidthComponent(getAddressById(components, WidthComponentID));

    uint256 entity = world.getUniqueEntityId();

    positionComponent.set(entity, location);
    rotationComponent.set(entity, rotation);
    lengthComponent.set(entity, length);
    widthComponent.set(entity, width);

    return abi.encode(entity);
  }

  function executeTyped(
    Coord memory location,
    uint32 rotation,
    uint32 length,
    uint32 width
  ) public returns (uint256) {
    return abi.decode(execute(abi.encode(location, rotation, length, width)), (uint256));
  }
}
