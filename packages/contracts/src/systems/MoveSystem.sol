// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { console } from "forge-std/console.sol";

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID, MoveCard } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID, Wind, GodID } from "../components/WindComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

import "../libraries/LibVector.sol";
import "../libraries/LibMove.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, uint256 moveCardEntity) = abi.decode(arguments, (uint256, uint256));

    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    require(moveCardComponent.has(moveCardEntity), "MoveSystem: invalid movecard entity id");
    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(entity),
      "MoveSystem: invalid ship entity id"
    );

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    Wind memory wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);

    Coord memory position = positionComponent.getValue(entity);
    uint32 rotation = rotationComponent.getValue(entity);

    moveCard.distance = LibMove.getMoveDistanceWithWind(moveCard.distance, rotation, wind);

    moveCard = LibMove.getMoveWithSails(
      moveCard,
      SailPositionComponent(getAddressById(components, SailPositionComponentID)).getValue(entity)
    );

    position = LibVector.getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);

    rotation = (rotation + moveCard.rotation) % 360;

    positionComponent.set(entity, position);
    rotationComponent.set(entity, rotation);
  }

  function executeTyped(uint256 entity, uint256 moveCardEntity) public returns (bytes memory) {
    return execute(abi.encode(entity, moveCardEntity));
  }
}
