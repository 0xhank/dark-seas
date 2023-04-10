// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { addressToEntity } from "solecs/utils.sol";
import { console } from "forge-std/console.sol";

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
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../components/DamagedCannonsComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";
import { PriceComponent, ID as PriceComponentID } from "../components/PriceComponent.sol";
import { OwnerOfComponent, ID as OwnerOfComponentID } from "../components/OwnerOfComponent.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";

// Types
import { Coord, GodID, ShipPrototype, GameConfig } from "./DSTypes.sol";

// Libraries
import "./LibUtils.sol";
import "./LibVector.sol";

library LibSpawn {
  /**
   * @notice  create and return an entityId corresponding to a player's address
   * @param   world world and components
   * @param   playerEntity player entity Id
   * @return  uint256  player entity Id
   */
  function createPlayerEntity(IWorld world, uint256 playerEntity) internal returns (uint256) {
    PlayerComponent(LibUtils.addressById(world, PlayerComponentID)).set(playerEntity);

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
  function getRandomPosition(IWorld world, uint256 gameId, uint256 r) public view returns (Coord memory) {
    uint32 worldHeight = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID))
      .getValue(gameId)
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

  function initializeShip(IWorld world, uint256 shipPrototypeEntity) public returns (uint256 shipEntity) {
    shipEntity = world.getUniqueEntityId();
    uint256 ownerEntity = addressToEntity(msg.sender);
    console.log("owner entity libspawn", ownerEntity);

    ShipComponent(LibUtils.addressById(world, ShipComponentID)).set(shipEntity);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(shipEntity, ownerEntity);
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(shipEntity, 0);
    SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(shipEntity, 2);

    SpeedComponent speedComponent = SpeedComponent(LibUtils.addressById(world, SpeedComponentID));
    speedComponent.set(shipEntity, speedComponent.getValue(shipPrototypeEntity));

    LengthComponent lengthComponent = LengthComponent(LibUtils.addressById(world, LengthComponentID));
    lengthComponent.set(shipEntity, lengthComponent.getValue(shipPrototypeEntity));

    MaxHealthComponent maxHealthComponent = MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID));
    maxHealthComponent.set(shipEntity, maxHealthComponent.getValue(shipPrototypeEntity));

    PriceComponent priceComponent = PriceComponent(LibUtils.addressById(world, PriceComponentID));
    priceComponent.set(shipEntity, priceComponent.getValue(shipPrototypeEntity));

    NameComponent nameComponent = NameComponent(LibUtils.addressById(world, NameComponentID));
    nameComponent.set(shipEntity, nameComponent.getValue(shipPrototypeEntity));

    uint256[] memory cannonPrototypeEntities = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID))
      .getValue(shipPrototypeEntity);
    for (uint256 i = 0; i < cannonPrototypeEntities.length; i++) {
      initializeCannon(world, shipEntity, cannonPrototypeEntities[i]);
    }
  }

  function initializeCannon(
    IWorld world,
    uint256 shipEntity,
    uint256 cannonPrototypeEntity
  ) internal returns (uint256 cannonEntity) {
    cannonEntity = world.getUniqueEntityId();
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));
    FirepowerComponent firepowerComponent = FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID));
    RangeComponent rangeComponent = RangeComponent(LibUtils.addressById(world, RangeComponentID));

    rotationComponent.set(cannonEntity, rotationComponent.getValue(cannonPrototypeEntity));
    firepowerComponent.set(cannonEntity, firepowerComponent.getValue(cannonPrototypeEntity));
    rangeComponent.set(cannonEntity, rangeComponent.getValue(cannonPrototypeEntity));

    CannonComponent(LibUtils.addressById(world, CannonComponentID)).set(cannonEntity);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(cannonEntity, shipEntity);
  }

  function spawn(
    IWorld world,
    uint256 gameId,
    uint256 playerEntity,
    uint256 ownerEntity,
    uint256[] memory ships
  ) public {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );
    Coord memory position = getRandomPosition(world, gameId, LibUtils.randomness(1, playerEntity));

    uint32 rotation = pointKindaTowardsTheCenter(position);
    uint32 spent = 0;
    for (uint256 i = 0; i < ships.length; i++) {
      spawnShip(world, gameId, position, rotation, ships[i]);
      uint32 price = PriceComponent(LibUtils.addressById(world, PriceComponentID)).getValue(ships[i]);
      spent += price;

      require(spent <= gameConfig.budget, "LibSpawn: ships too expensive");

      position = Coord(
        position.x + (position.x >= 0 ? -15 : int32(15)),
        position.y + (position.y >= 0 ? -15 : int32(15))
      );
    }

    LastActionComponent(LibUtils.addressById(world, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(LibUtils.addressById(world, LastMoveComponentID)).set(playerEntity, 0);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(playerEntity, ownerEntity);
  }

  /**
   * @notice  .
   * @dev     .
   * @param   world  .
   * @param   gameId  .
   * @param   position  .
   * @param   rotation  .
   */
  function spawnShip(
    IWorld world,
    uint256 gameId,
    Coord memory position,
    uint32 rotation,
    uint256 shipEntity
  ) internal {
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
    require(!currentGameComponent.has(shipEntity), "SpawnSystem: ship is already playing another game");
    uint256 ownerEntity = addressToEntity(msg.sender);
    require(
      OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(shipEntity) == ownerEntity,
      "SpawnSystem: you do not own this ship"
    );

    currentGameComponent.set(shipEntity, gameId);
    OnFireComponent(LibUtils.addressById(world, OnFireComponentID)).remove(shipEntity);
    DamagedCannonsComponent(LibUtils.addressById(world, DamagedCannonsComponentID)).remove(shipEntity);
    SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(shipEntity, 2);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(shipEntity, position);
    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(shipEntity, rotation);
    uint32 maxHealth = MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).getValue(shipEntity);
    HealthComponent(LibUtils.addressById(world, HealthComponentID)).set(shipEntity, maxHealth);
    LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).set(shipEntity, GodID);
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(shipEntity, 0);
    RangeComponent(LibUtils.addressById(world, RangeComponentID)).set(shipEntity, 0);
  }

  /**
   * @notice  spawns a cannon on the shipEntity provided
   * @param   world world and components
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
