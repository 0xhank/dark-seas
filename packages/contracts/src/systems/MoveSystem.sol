// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { console } from "forge-std/console.sol";

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../components/WindComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

import { Wind, GodID, MoveCard } from "../libraries/DSTypes.sol";
import "../libraries/LibVector.sol";
import "../libraries/LibMove.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, uint256[] memory moveCardEntities) = abi.decode(arguments, (uint256[], uint256[]));

    require(entities.length == moveCardEntities.length, "MoveSystem: array length mismatch");

    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );
    Wind memory wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);

    for (uint256 i = 0; i < entities.length; i++) {
      uint256 moveCardEntity = moveCardEntities[i];
      uint256 entity = entities[i];

      console.log("move card entity:", moveCardEntity);
      console.log("expected:", uint256(keccak256("ds.prototype.moveEntity1")));

      require(moveCardComponent.has(moveCardEntity), "MoveSystem: invalid move card entity id");
      require(shipComponent.has(entity), "MoveSystem: invalid ship entity id");

      MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

      Coord memory position = positionComponent.getValue(entity);
      uint32 rotation = rotationComponent.getValue(entity);

      moveCard.distance = LibMove.getMoveDistanceWithWind(moveCard.distance, rotation, wind);

      moveCard = LibMove.getMoveWithSails(moveCard, sailPositionComponent.getValue(entity));

      position = LibVector.getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);

      rotation = (rotation + moveCard.rotation) % 360;

      positionComponent.set(entity, position);
      rotationComponent.set(entity, rotation);
    }
  }

  function executeTyped(uint256[] calldata entities, uint256[] calldata moveCardEntities)
    public
    returns (bytes memory)
  {
    return execute(abi.encode(entities, moveCardEntities));
  }
}
