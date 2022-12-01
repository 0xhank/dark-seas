// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { PlayerComponent, ID as PlayerComponentID } from "../components/PlayerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";

import { Coord } from "../libraries/DSTypes.sol";

library LibSpawn {
  function createPlayerEntity(IUint256Component components, address playerAddress) internal returns (uint256) {
    uint256 playerEntity = addressToEntity(playerAddress);
    uint32 playerId = uint32(getExistingPlayers(components).length + 1);

    PlayerComponent(getAddressById(components, PlayerComponentID)).set(playerEntity, playerId);

    return playerEntity;
  }

  function spawn(
    IWorld world,
    IUint256Component components,
    uint256 playerEntity
  ) public {
    int32 x = 0;
    int32 y = 0;
    uint32 rotation = 0;
    for (uint256 i = 0; i < 3; i++) {
      x += 10;
      rotation += 10;
      uint256 entity = world.getUniqueEntityId();
      spawnShip(components, entity, playerEntity, Coord(x, y), rotation);
    }

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(playerEntity, 1);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(playerEntity, 1);
  }

  function playerExists(IUint256Component components, address playerAddress) internal view returns (bool) {
    PlayerComponent playerComponent = PlayerComponent(getAddressById(components, PlayerComponentID));
    return playerComponent.has(addressToEntity(playerAddress));
  }

  function getExistingPlayers(IUint256Component components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(
      QueryType.Has,
      PlayerComponent(getAddressById(components, PlayerComponentID)),
      new bytes(0)
    );

    return LibQuery.query(fragments);
  }

  function spawnShip(
    IUint256Component components,
    uint256 entity,
    uint256 playerEntity,
    Coord memory location,
    uint32 rotation
  ) internal {
    PositionComponent(getAddressById(components, PositionComponentID)).set(entity, location);
    RotationComponent(getAddressById(components, RotationComponentID)).set(entity, rotation);
    LengthComponent(getAddressById(components, LengthComponentID)).set(entity, 10);
    RangeComponent(getAddressById(components, RangeComponentID)).set(entity, 50);
    HealthComponent(getAddressById(components, HealthComponentID)).set(entity, 10);
    ShipComponent(getAddressById(components, ShipComponentID)).set(entity);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(entity, 3);
    CrewCountComponent(getAddressById(components, CrewCountComponentID)).set(entity, 8);
    FirepowerComponent(getAddressById(components, FirepowerComponentID)).set(entity, 50);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(entity, playerEntity);
  }
}
