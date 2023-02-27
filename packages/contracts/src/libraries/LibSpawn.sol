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
import { KillsComponent, ID as KillsComponentID } from "../components/KillsComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../components/BootyComponent.sol";
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
   * @param   components  world components
   * @param   playerAddress  player address
   * @return  uint256  player entity Id
   */
  function createPlayerEntity(IUint256Component components, address playerAddress) internal returns (uint256) {
    uint256 playerEntity = addressToEntity(playerAddress);
    uint32 playerId = uint32(LibUtils.getExistingPlayers(components).length + 1);

    PlayerComponent(getAddressById(components, PlayerComponentID)).set(playerEntity, playerId);

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(playerEntity, 0);
    BootyComponent(getAddressById(components, BootyComponentID)).set(playerEntity, 0);
    return playerEntity;
  }

  /**
   * @notice  generates a random position using random seed
   * @param   components  world components
   * @param   r  random seed
   * @return  Coord  randomly generated position
   */
  function getRandomPosition(IUint256Component components, uint256 r) public view returns (Coord memory) {
    uint32 worldHeight = GameConfigComponent(getAddressById(components, GameConfigComponentID))
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
    int32 buffer = 40;
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
    IUint256Component components,
    uint256 playerEntity,
    uint256[] memory shipPrototypes
  ) public {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    // uint256 prototypeRandomness = uint256(keccak256(abi.encode(shipPrototypes)));
    Coord memory startingPosition = getRandomPosition(components, LibUtils.randomness(1, playerEntity));

    uint32 rotation = pointKindaTowardsTheCenter(startingPosition);
    uint32 spent = 0;
    for (uint256 i = 0; i < shipPrototypes.length; i++) {
      uint32 price = spawnShip(
        components,
        world,
        playerEntity,
        startingPosition,
        rotation,
        shipPrototypes[i],
        gameConfig.buyin
      );
      spent += price;

      require(spent <= gameConfig.budget, "LibSpawn: ships too expensive");
      startingPosition = Coord(startingPosition.x + 20, startingPosition.y);
    }

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(playerEntity, 0);
  }

  /**
   * @notice  spawns a basic ship type
   * @dev todo: move this to shipPrototype and create a couple options for ships
   * @param   components  creates a ship
   * @param   world  world
   * @param   playerEntity  entity id of ship's owner
   * @param   position  starting position of ship
   * @param   rotation  starting rotation of ship
   */
  function spawnShip(
    IUint256Component components,
    IWorld world,
    uint256 playerEntity,
    Coord memory position,
    uint32 rotation,
    uint256 shipPrototypeEntity,
    uint256 startingBooty
  ) internal returns (uint32) {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      getAddressById(components, ShipPrototypeComponentID)
    );

    require(shipPrototypeComponent.has(shipPrototypeEntity), "spawnShip: ship prototype does not exist");

    console.log(shipPrototypeComponent.getValue(shipPrototypeEntity));

    ShipPrototype memory shipPrototype = abi.decode(
      bytes(shipPrototypeComponent.getValue(shipPrototypeEntity)),
      (ShipPrototype)
    );

    uint256 shipEntity = world.getUniqueEntityId();
    ShipComponent(getAddressById(components, ShipComponentID)).set(shipEntity);

    PositionComponent(getAddressById(components, PositionComponentID)).set(shipEntity, position);
    RotationComponent(getAddressById(components, RotationComponentID)).set(shipEntity, rotation);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(shipEntity, 2);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(shipEntity, playerEntity);
    SpeedComponent(getAddressById(components, SpeedComponentID)).set(shipEntity, shipPrototype.speed);
    LengthComponent(getAddressById(components, LengthComponentID)).set(shipEntity, shipPrototype.length);
    HealthComponent(getAddressById(components, HealthComponentID)).set(shipEntity, shipPrototype.maxHealth);
    MaxHealthComponent(getAddressById(components, MaxHealthComponentID)).set(shipEntity, shipPrototype.maxHealth);
    KillsComponent(getAddressById(components, KillsComponentID)).set(shipEntity, 0);
    BootyComponent(getAddressById(components, BootyComponentID)).set(shipEntity, startingBooty);
    LastHitComponent(getAddressById(components, LastHitComponentID)).set(shipEntity, GodID);
    for (uint256 i = 0; i < shipPrototype.cannons.length; i++) {
      spawnCannon(
        components,
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
    IUint256Component components,
    uint256 shipEntity,
    Coord memory position,
    uint32 rotation,
    uint256 booty
  ) internal {
    PositionComponent(getAddressById(components, PositionComponentID)).set(shipEntity, position);
    RotationComponent(getAddressById(components, RotationComponentID)).set(shipEntity, rotation);
    LengthComponent(getAddressById(components, LengthComponentID)).set(shipEntity, 10);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(shipEntity, 2);

    uint32 maxHealth = MaxHealthComponent(getAddressById(components, MaxHealthComponentID)).getValue(shipEntity);
    HealthComponent(getAddressById(components, HealthComponentID)).set(shipEntity, maxHealth);
    KillsComponent(getAddressById(components, KillsComponentID)).set(shipEntity, 0);
    BootyComponent(getAddressById(components, BootyComponentID)).set(shipEntity, booty);
    OnFireComponent(getAddressById(components, OnFireComponentID)).remove(shipEntity);
    DamagedCannonsComponent(getAddressById(components, DamagedCannonsComponentID)).remove(shipEntity);
  }

  /**
   * @notice  spawns a cannon on the shipEntity provided
   * @param   components  world components
   * @param   world  in which components reside
   * @param   shipEntity  ship that owns this cannon
   * @param   rotation  of cannon in relation to ship's bow
   * @param   firepower  determines the likelihood of a hit from this ship
   * @param   range  distance the ship can shoot
   * @return  cannonEntity  entity id of the created cannon
   */
  function spawnCannon(
    IUint256Component components,
    IWorld world,
    uint256 shipEntity,
    uint32 rotation,
    uint32 firepower,
    uint32 range
  ) internal returns (uint256 cannonEntity) {
    cannonEntity = world.getUniqueEntityId();

    CannonComponent(getAddressById(components, CannonComponentID)).set(cannonEntity);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(cannonEntity, shipEntity);
    RotationComponent(getAddressById(components, RotationComponentID)).set(cannonEntity, rotation);
    FirepowerComponent(getAddressById(components, FirepowerComponentID)).set(cannonEntity, firepower);
    RangeComponent(getAddressById(components, RangeComponentID)).set(cannonEntity, range);
  }
}
