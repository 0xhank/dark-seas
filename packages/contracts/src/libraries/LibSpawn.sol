// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { PlayerComponent, ID as PlayerComponentID } from "../components/PlayerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Coord, GodID } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibVector.sol";

library LibSpawn {
  /**
   * @notice  create and return an entityId corresponding to a player's address
   * @param   components  world components
   * @param   playerAddress  player address
   * @return  uint256  player entity Id
   */
  function createPlayerEntity(IUint256Component components, address playerAddress) internal returns (uint256) {
    uint256 playerEntity = addressToEntity(playerAddress);
    uint32 playerId = uint32(LibUtils.getExistingPlayers(components).length + 1);

    PlayerComponent(getAddressById(components, PlayerComponentID)).set(playerEntity, playerId);

    return playerEntity;
  }

  /**
   * @notice  generates a random location using random seed
   * @param   components  world components
   * @param   r  random seed
   * @return  Coord  randomly generated location
   */
  function getRandomLocation(IUint256Component components, uint256 r) public view returns (Coord memory) {
    uint256 worldRadius = GameConfigComponent(getAddressById(components, GameConfigComponentID))
      .getValue(GodID)
      .worldRadius;

    uint32 distance = uint32(LibUtils.getByteUInt(r, 14, 0) % (worldRadius - 70));
    uint32 rotation = uint32(LibUtils.getByteUInt(r, 14, 14) % 360);

    Coord memory location = LibVector.getPositionByVector(Coord(0, 0), 0, distance, rotation);

    return location;
  }

  /**
   * @notice  points ships kinda towards the center of the map based on their location
   * @param   a  coordinate of ship
   * @return  uint32  direction to face
   */
  function pointKindaTowardsTheCenter(Coord memory a) public pure returns (uint32) {
    if (a.x >= 0 && a.y >= 0) return 235;
    if (a.x < 0 && a.y >= 0) return 315;
    if (a.x < 0 && a.y < 0) return 45;
    if (a.x < 0 && a.y >= 0) return 135;

    return 135;
  }

  /**
   * @notice  spawns three ships for player next to each other
   * @param   world  world in question
   * @param   components  world components
   * @param   playerEntity  player's entity id
   * @param   startingLocation location at which to spawn (currently used as source of randomness hehe)
   */
  function spawn(
    IWorld world,
    IUint256Component components,
    uint256 playerEntity,
    Coord memory startingLocation
  ) public {
    uint256 nonce = uint256(keccak256(abi.encode(startingLocation)));
    startingLocation = getRandomLocation(components, LibUtils.randomness(playerEntity, nonce));

    uint32 rotation = pointKindaTowardsTheCenter(startingLocation);
    for (uint256 i = 0; i < 3; i++) {
      uint256 entity = world.getUniqueEntityId();
      spawnShip(components, entity, playerEntity, startingLocation, rotation);
      startingLocation.x += 20;
    }

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(playerEntity, 0);
  }

  /**
   * @notice  spawns a basic ship type
   * @dev todo: move this to shipPrototype and create a couple options for ships
   * @param   components  creates a ship
   * @param   shipEntity  entity id of ship
   * @param   playerEntity  entity id of ship's owner
   * @param   location  starting location of ship
   * @param   rotation  starting rotation of ship
   */
  function spawnShip(
    IUint256Component components,
    uint256 shipEntity,
    uint256 playerEntity,
    Coord memory location,
    uint32 rotation
  ) internal {
    PositionComponent(getAddressById(components, PositionComponentID)).set(shipEntity, location);
    RotationComponent(getAddressById(components, RotationComponentID)).set(shipEntity, rotation);
    LengthComponent(getAddressById(components, LengthComponentID)).set(shipEntity, 10);
    RangeComponent(getAddressById(components, RangeComponentID)).set(shipEntity, 80);
    HealthComponent(getAddressById(components, HealthComponentID)).set(shipEntity, 10);
    ShipComponent(getAddressById(components, ShipComponentID)).set(shipEntity);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(shipEntity, 2);
    CrewCountComponent(getAddressById(components, CrewCountComponentID)).set(shipEntity, 8);
    FirepowerComponent(getAddressById(components, FirepowerComponentID)).set(shipEntity, 50);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(shipEntity, playerEntity);
  }
}
