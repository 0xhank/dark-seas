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
import { MoveDirectionComponent, ID as MoveDirectionComponentID } from "../components/MoveDirectionComponent.sol";
import { MoveDistanceComponent, ID as MoveDistanceComponentID } from "../components/MoveDistanceComponent.sol";
import { MoveRotationComponent, ID as MoveRotationComponentID } from "../components/MoveRotationComponent.sol";
import { WindComponent, ID as WindComponentID, Wind, GodID } from "../components/WindComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

import "../libraries/LibVector.sol";
import "../libraries/LibNature.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, uint256 movementEntity) = abi.decode(arguments, (uint256, uint256));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    MoveDirectionComponent moveDirectionComponent = MoveDirectionComponent(
      getAddressById(components, MoveDirectionComponentID)
    );
    Wind memory wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);

    require(moveDirectionComponent.has(movementEntity), "MoveSystem: movement entity not a movement entity");

    uint32 moveDistance = MoveDistanceComponent(getAddressById(components, MoveDistanceComponentID)).getValue(
      movementEntity
    );
    uint32 moveDirection = moveDirectionComponent.getValue(movementEntity);
    uint32 moveRotation = MoveRotationComponent(getAddressById(components, MoveRotationComponentID)).getValue(
      movementEntity
    );

    moveDistance = LibNature.getMoveDistanceWithWind(moveDistance, rotationComponent.getValue(entity), wind);

    (moveDistance, moveRotation, moveDirection) = LibNature.getMoveDistanceAndRotationWithSails(
      moveDistance,
      moveRotation,
      moveDirection,
      SailPositionComponent(getAddressById(components, SailPositionComponentID)).getValue(entity)
    );

    Coord memory finalPosition = LibVector.getPositionByVector(
      positionComponent.getValue(entity),
      rotationComponent.getValue(entity),
      moveDistance,
      moveDirection
    );

    rotation = (rotation + moveDirection) % 360;

    positionComponent.set(entity, finalPosition);
    rotationComponent.set(entity, newRotation);
  }

  function executeTyped(uint256 entity, uint256 movementEntity) public returns (bytes memory) {
    return execute(abi.encode(entity, movementEntity));
  }
}
