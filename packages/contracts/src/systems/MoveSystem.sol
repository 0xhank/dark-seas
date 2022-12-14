// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

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
import { CommitmentComponent, ID as CommitmentComponentID } from "../components/CommitmentComponent.sol";

import { Wind, GodID, MoveCard, Phase } from "../libraries/DSTypes.sol";
import "../libraries/LibVector.sol";
import "../libraries/LibMove.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Move"));

contract MoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, uint256[] memory moveCardEntities, uint256 salt) = abi.decode(
      arguments,
      (uint256[], uint256[], uint256)
    );

    uint256 playerEntity = addressToEntity(msg.sender);

    require(
      uint256(keccak256(arguments)) ==
        CommitmentComponent(getAddressById(components, CommitmentComponentID)).getValue(playerEntity),
      "MoveSystem: commitment doesn't match move"
    );

    require(entities.length == moveCardEntities.length, "MoveSystem: array length mismatch");

    require(LibUtils.playerIdExists(components, playerEntity), "MoveSystem: player does not exist");

    LastMoveComponent lastMoveComponent = LastMoveComponent(getAddressById(components, LastMoveComponentID));
    require(LibTurn.getCurrentPhase(components) == Phase.Reveal, "MoveSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(components);
    require(lastMoveComponent.getValue(playerEntity) < currentTurn, "MoveSystem: already moved this turn");

    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    Wind memory wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);

    // iterate through each ship entity
    for (uint256 i = 0; i < entities.length; i++) {
      uint256 moveCardEntity = moveCardEntities[i];
      uint256 entity = entities[i];

      LibMove.moveShip(components, entity, playerEntity, moveCardEntity, wind);
    }

    lastMoveComponent.set(playerEntity, currentTurn);
  }

  function executeTyped(
    uint256[] calldata entities,
    uint256[] calldata moveCardEntities,
    uint256 salt
  ) public returns (bytes memory) {
    return execute(abi.encode(entities, moveCardEntities, salt));
  }
}
