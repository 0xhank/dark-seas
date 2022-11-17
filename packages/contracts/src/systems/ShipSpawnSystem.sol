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
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.ShipSpawn"));

contract ShipSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (Coord memory location, uint32 rotation, uint32 length, uint32 range) = abi.decode(
      arguments,
      (Coord, uint32, uint32, uint32)
    );

    uint256 entity = world.getUniqueEntityId();

    PositionComponent(getAddressById(components, PositionComponentID)).set(entity, location);
    RotationComponent(getAddressById(components, RotationComponentID)).set(entity, rotation);
    LengthComponent(getAddressById(components, LengthComponentID)).set(entity, length);
    RangeComponent(getAddressById(components, RangeComponentID)).set(entity, range);
    HealthComponent(getAddressById(components, HealthComponentID)).set(entity, 100);
    ShipComponent(getAddressById(components, ShipComponentID)).set(entity);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(entity);

    return abi.encode(entity);
  }

  function executeTyped(
    Coord memory location,
    uint32 rotation,
    uint32 length,
    uint32 range
  ) public returns (uint256) {
    return abi.decode(execute(abi.encode(location, rotation, length, range)), (uint256));
  }
}
