// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { console } from "forge-std/console.sol";

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { MoveAngleComponent, ID as MoveAngleComponentID } from "../components/MoveAngleComponent.sol";
import { MoveDistanceComponent, ID as MoveDistanceComponentID } from "../components/MoveDistanceComponent.sol";
import { MoveRotationComponent, ID as MoveRotationComponentID } from "../components/MoveRotationComponent.sol";

import "../libraries/LibVector.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, uint256 movementEntity) = abi.decode(arguments, (uint256, uint256));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    MoveAngleComponent moveAngleComponent = MoveAngleComponent(getAddressById(components, MoveAngleComponentID));
    MoveRotationComponent moveRotationComponent = MoveRotationComponent(
      getAddressById(components, MoveRotationComponentID)
    );
    MoveDistanceComponent moveDistanceComponent = MoveDistanceComponent(
      getAddressById(components, MoveDistanceComponentID)
    );

    require(moveAngleComponent.has(movementEntity), "MoveSystem: movement entity not a movement entity");

    Coord memory finalPosition = LibVector.getPositionByVector(
      positionComponent.getValue(entity),
      rotationComponent.getValue(entity),
      moveDistanceComponent.getValue(movementEntity),
      moveAngleComponent.getValue(movementEntity)
    );

    uint32 newRotation = (rotationComponent.getValue(entity) + moveRotationComponent.getValue(movementEntity)) % 360;

    positionComponent.set(entity, finalPosition);
    rotationComponent.set(entity, newRotation);
  }

  function executeTyped(uint256 entity, uint256 movementEntity) public returns (bytes memory) {
    return execute(abi.encode(entity, movementEntity));
  }
}
