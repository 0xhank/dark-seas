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

import "trig/src/Trigonometry.sol";

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

    Coord memory finalPosition = calculateFinalPosition(
      positionComponent.getValue(entity),
      rotationComponent.getValue(entity),
      moveDistanceComponent.getValue(movementEntity),
      moveAngleComponent.getValue(movementEntity)
    );

    uint32 newRotation = (rotationComponent.getValue(entity) + moveRotationComponent.getValue(movementEntity)) % 360;

    positionComponent.set(entity, finalPosition);
    rotationComponent.set(entity, newRotation);
  }

  function calculateFinalPosition(
    Coord memory initialPosition,
    uint32 initialRotation,
    uint32 moveDistance,
    uint32 moveAngle
  ) internal returns (Coord memory) {
    uint32 angleDegs = (initialRotation + moveAngle) % 360;

    console.log("angle degs:", angleDegs);

    uint256 angleRadsTimes10000 = uint256(angleDegs * 1745);

    console.log("angle rads times 10000:", angleRadsTimes10000);

    uint256 angleRadsConverted = angleRadsTimes10000 * 1e13 + Trigonometry.TWO_PI;

    console.log("angle rads converted:", angleRadsConverted);

    int256 newX = Trigonometry.cos(angleRadsConverted) * int32(moveDistance);
    console.log("new X:", angleRadsConverted);

    int256 newY = Trigonometry.sin(angleRadsConverted) * int32(moveDistance);

    console.log("new Y:", angleRadsConverted);

    int256 unconvertedX = newX / 1e18;
    int256 unconvertedY = newY / 1e18;

    return Coord({ x: int32(unconvertedX), y: int32(unconvertedY) });
  }

  function executeTyped(uint256 entity, uint256 movementEntity) public returns (bytes memory) {
    return execute(abi.encode(entity, movementEntity));
  }
}
