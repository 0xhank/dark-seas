// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { console } from "forge-std/console.sol";

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../components/WindComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";

import { Wind, GodID, MoveCard, Phase } from "../libraries/DSTypes.sol";
import "../libraries/LibVector.sol";
import "../libraries/LibMove.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, uint256[] memory moveCardEntities) = abi.decode(arguments, (uint256[], uint256[]));

    require(entities.length == moveCardEntities.length, "MoveSystem: array length mismatch");

    uint256 playerEntity = addressToEntity(msg.sender);
    require(LibSpawn.playerIdExists(components, playerEntity), "MoveSystem: player does not exist");

    LastMoveComponent lastMoveComponent = LastMoveComponent(getAddressById(components, LastMoveComponentID));
    require(LibTurn.getCurrentPhase(components) == Phase.Move, "MoveSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(components);
    require(lastMoveComponent.getValue(playerEntity) < currentTurn, "MoveSystem: already moved this turn");
    lastMoveComponent.set(playerEntity, currentTurn);

    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );
    Wind memory wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);

    for (uint256 i = 0; i < entities.length; i++) {
      uint256 moveCardEntity = moveCardEntities[i];
      uint256 entity = entities[i];

      require(
        HealthComponent(getAddressById(components, HealthComponentID)).getValue(entity) > 0,
        "MoveSystem: ship is sunk"
      );

      require(
        CrewCountComponent(getAddressById(components, CrewCountComponentID)).getValue(entity) > 0,
        "MoveSystem: ship has no crew"
      );

      require(
        OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(entity) == playerEntity,
        "MoveSystem: you don't own this ship"
      );
      require(moveCardComponent.has(moveCardEntity), "MoveSystem: invalid move card entity id");
      require(
        ShipComponent(getAddressById(components, ShipComponentID)).has(entity),
        "MoveSystem: invalid ship entity id"
      );

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
