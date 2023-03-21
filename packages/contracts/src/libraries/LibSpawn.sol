// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { addressToEntity } from "solecs/utils.sol";

// Components
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { PlayerComponent, ID as PlayerComponentID } from "../components/PlayerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../components/MaxHealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { LastHitComponent, ID as LastHitComponentID } from "../components/LastHitComponent.sol";
import { CannonComponent, ID as CannonComponentID } from "../components/CannonComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../components/SpeedComponent.sol";
import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";

// Types
import { Coord, GodID, ShipPrototype, GameConfig } from "./DSTypes.sol";

// Libraries
import "./LibUtils.sol";
import "./LibVector.sol";

library LibSpawn {
  /**
   * @notice  create and return an entityId corresponding to a player's address
   * @param   world world and components
   * @param   playerAddress  player address
   * @return  uint256  player entity Id
   */
  function createPlayerEntity(IWorld world, address playerAddress) internal returns (uint256) {
    uint256 playerEntity = addressToEntity(playerAddress);
    uint32 playerId = uint32(LibUtils.getExistingPlayers(world).length + 1);

    PlayerComponent(LibUtils.addressById(world, PlayerComponentID)).set(playerEntity, playerId);

    LastActionComponent(LibUtils.addressById(world, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(LibUtils.addressById(world, LastMoveComponentID)).set(playerEntity, 0);
    return playerEntity;
  }

  /**
   * @notice  generates a random position using random seed
   * @param   world world and components
   * @param   r  random seed
   * @return  Coord  randomly generated position
   */
  function getRandomPosition(IWorld world, uint256 r) public view returns (Coord memory) {
    uint32 worldHeight = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID))
      .getValue(GodID)
      .worldSize;
    uint32 worldWidth = (worldHeight * 16) / 9;
    bool useWidth = r % 2 == 1;
    uint256 y = 0;
    uint256 x = 0;
    if (useWidth) {
      x = (LibUtils.getByteUInt(r, 14, 14) % worldWidth);
      y = worldHeight;
    } else {
      x = worldWidth;
      y = (LibUtils.getByteUInt(r, 14, 14) % worldHeight);
    }
    int32 buffer = 10;
    int32 retY = r % 4 < 2 ? int32(uint32(y)) - buffer : buffer - int32(uint32(y));
    int32 retX = r % 8 < 4 ? int32(uint32(x)) - buffer : buffer - int32(uint32(x));
    return Coord(retX, retY);
  }

  /**
   * @notice  points ships kinda towards the center of the map based on their position
   * @param   a  coordinate of ship
   * @return  uint32  direction to face
   */
  function pointKindaTowardsTheCenter(Coord memory a) public pure returns (uint32) {
    if (a.x >= 0 && a.y >= 0) return 235;
    if (a.x < 0 && a.y >= 0) return 315;
    if (a.x < 0 && a.y < 0) return 45;
    return 135;
  }

  function spawn(
    IWorld world,
    uint256 playerEntity,
    uint256[] memory shipPrototypes
  ) public {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    // uint256 prototypeRandomness = uint256(keccak256(abi.encode(shipPrototypes)));
    Coord memory position = getRandomPosition(world, LibUtils.randomness(1, playerEntity));

    uint32 rotation = pointKindaTowardsTheCenter(position);
    uint32 spent = 0;
    for (uint256 i = 0; i < shipPrototypes.length; i++) {
      uint32 price = spawnShip(world, playerEntity, position, rotation, shipPrototypes[i]);
      spent += price;

      require(spent <= gameConfig.budget, "LibSpawn: ships too expensive");

      position = Coord(
        position.x + (position.x >= 0 ? -15 : int32(15)),
        position.y + (position.y >= 0 ? -15 : int32(15))
      );
    }

    LastActionComponent(LibUtils.addressById(world, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(LibUtils.addressById(world, LastMoveComponentID)).set(playerEntity, 0);
  }

  /**
   * @notice  spawns a basic ship type
   * @dev todo: move this to shipPrototype and create a couple options for ships
   * @param   world  world
   * @param   playerEntity  entity id of ship's owner
   * @param   position  starting position of ship
   * @param   rotation  starting rotation of ship
   */
  function spawnShip(
    IWorld world,
    uint256 playerEntity,
    Coord memory position,
    uint32 rotation,
    uint256 shipPrototypeEntity
  ) internal returns (uint32) {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );

    require(shipPrototypeComponent.has(shipPrototypeEntity), "spawnShip: ship prototype does not exist");

    ShipPrototype memory shipPrototype = abi.decode(
      bytes(shipPrototypeComponent.getValue(shipPrototypeEntity)),
      (ShipPrototype)
    );

    uint256 shipEntity = world.getUniqueEntityId();
    ShipComponent(LibUtils.addressById(world, ShipComponentID)).set(shipEntity);

    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(shipEntity, position);
    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(shipEntity, rotation);
    SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(shipEntity, 2);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(shipEntity, playerEntity);
    SpeedComponent(LibUtils.addressById(world, SpeedComponentID)).set(shipEntity, shipPrototype.speed);
    LengthComponent(LibUtils.addressById(world, LengthComponentID)).set(shipEntity, shipPrototype.length);
    HealthComponent(LibUtils.addressById(world, HealthComponentID)).set(shipEntity, shipPrototype.maxHealth);
    MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).set(shipEntity, shipPrototype.maxHealth);
    LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).set(shipEntity, GodID);
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(shipEntity, 0);
    for (uint256 i = 0; i < shipPrototype.cannons.length; i++) {
      spawnCannon(
        world,
        shipEntity,
        shipPrototype.cannons[i].rotation,
        shipPrototype.cannons[i].firepower,
        shipPrototype.cannons[i].range
      );
    }
    return shipPrototype.price;
  }

  function respawnShip(
    IWorld world,
    uint256 shipEntity,
    Coord memory position,
    uint32 rotation
  ) internal {
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(shipEntity, position);
    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(shipEntity, rotation);
    LengthComponent(LibUtils.addressById(world, LengthComponentID)).set(shipEntity, 10);
    SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(shipEntity, 2);

    uint32 maxHealth = MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).getValue(shipEntity);
    HealthComponent(LibUtils.addressById(world, HealthComponentID)).set(shipEntity, maxHealth);
    OnFireComponent(LibUtils.addressById(world, OnFireComponentID)).remove(shipEntity);
    DamagedCannonsComponent(LibUtils.addressById(world, DamagedCannonsComponentID)).remove(shipEntity);
  }

  /**
   * @notice  spawns a cannon on the shipEntity provided
   * @param   world world and components
   * @param   world  in which components reside
   * @param   shipEntity  ship that owns this cannon
   * @param   rotation  of cannon in relation to ship's bow
   * @param   firepower  determines the likelihood of a hit from this ship
   * @param   range  distance the ship can shoot
   * @return  cannonEntity  entity id of the created cannon
   */
  function spawnCannon(
    IWorld world,
    uint256 shipEntity,
    uint32 rotation,
    uint32 firepower,
    uint32 range
  ) internal returns (uint256 cannonEntity) {
    cannonEntity = world.getUniqueEntityId();

    CannonComponent(LibUtils.addressById(world, CannonComponentID)).set(cannonEntity);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(cannonEntity, shipEntity);
    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(cannonEntity, rotation);
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(cannonEntity, firepower);
    RangeComponent(LibUtils.addressById(world, RangeComponentID)).set(cannonEntity, range);
  }
}
