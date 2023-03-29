// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems

// Components
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../../components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../../components/RangeComponent.sol";

// Libraries
import "../../libraries/LibCombat.sol";
import "../../libraries/LibUtils.sol";
import "../../libraries/LibSpawn.sol";

contract LibCombatTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  address zero = address(0);

  function testGetBaseHitChance() public prank(deployer) {
    uint256 baseHitChance = LibCombat.getBaseHitChance(28, 10);
    assertApproxEqAbs(baseHitChance, 1998, 50, "baseHitChance: 28 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(0, 10);
    assertApproxEqAbs(baseHitChance, 2500, 50, "baseHitChance: 0 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(14, 18);
    assertApproxEqAbs(baseHitChance, 4023, 50, "baseHitChance: 14 and 90 failed");

    baseHitChance = LibCombat.getBaseHitChance(48, 1);
    assertApproxEqAbs(baseHitChance, 170, 50, "baseHitChance: 48 and 5 failed");
  }

  function testGetByteUInt() public prank(deployer) {
    uint256 randomness = LibUtils.randomness(69, 420);

    uint256 byteUInt = LibUtils.getByteUInt(randomness, 0, 14);
    console.log("byte (0, 1):", byteUInt);

    byteUInt = LibUtils.getByteUInt(randomness, 15, 5);
    console.log("byte (5, 15):", byteUInt);

    byteUInt = LibUtils.getByteUInt(randomness, 40, 20);
    console.log("byte (40, 20):", byteUInt);
  }

  function testGetHullDamage() public prank(deployer) {
    uint256 baseHitChance = 1000;
    uint256 threeDamage = (16384 * 999) / uint256(10000);
    uint256 twoDamage = (16384 * 1699) / uint256(10000);
    uint256 oneDamage = (16384 * 3499) / uint256(10000);
    uint256 zeroDamage = (16384 * 8001) / uint256(10000);

    assertEq(LibCombat.getHullDamage(baseHitChance, threeDamage), 3, "hull 3 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, twoDamage), 2, "hull 2 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, oneDamage), 1, "hull 1 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, zeroDamage), 0, "hull 0 failed");
  }

  function testGetSpecialChance() public prank(deployer) {
    uint256 baseHitChance = 1000;
    uint256 likelihood = (baseHitChance * 6) / 10;
    uint256 tru = (((likelihood - 5) * 16384) / uint256(10000)) << (14 * 2); // 0x4E1C000
    uint256 fals = (((likelihood + 5) * 16384) / uint256(10000)) << (14 * 2);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, 1, tru, 0), "special 0 tru failed");
    assertFalse(LibCombat.getSpecialChance(baseHitChance, 1, fals, 0), "special 0 fals failed");

    likelihood = (likelihood * 11) / 10;
    tru = (((likelihood - 5) * 16384) / uint256(10000)) << (14 * 3); // 0x4E1C000
    fals = (((likelihood + 5) * 16384) / uint256(10000)) << (14 * 3);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, 2, tru, 1), "special 1 true failed");
    assertFalse(LibCombat.getSpecialChance(baseHitChance, 2, fals, 1), "special 1 false failed");
  }

  function testFiringArea() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = spawnShip(gameId, startingPosition, 0, deployer);

    CannonComponent cannonComponent = CannonComponent(LibUtils.addressById(world, CannonComponentID));

    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 270, 10, 80);

    uint32 cannonRotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(cannonEntity);
    uint32 rotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(shipEntity);
    uint32 length = LengthComponent(LibUtils.addressById(world, LengthComponentID)).getValue(shipEntity);
    uint32 range = RangeComponent(LibUtils.addressById(world, RangeComponentID)).getValue(cannonEntity);

    uint32 rightRange = (cannonRotation + 10) % 360;
    uint32 leftRange = (cannonRotation - 10) % 360;

    Coord[] memory firingArea = LibCombat.getFiringArea(world, shipEntity, cannonEntity);

    Coord memory stern = LibVector.getSternPosition(startingPosition, rotation, length);
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, leftRange);
    Coord memory frontCorner = LibVector.getPositionByVector(startingPosition, rotation, range, rightRange);

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(stern, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
    assertCoordEq(frontCorner, firingArea[3]);
  }

  function testFiringAreaUpsideDown() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = spawnShip(gameId, startingPosition, 180, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 90, 10, 80);

    uint32 cannonRotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(cannonEntity);
    uint32 rotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(shipEntity);
    uint32 length = LengthComponent(LibUtils.addressById(world, LengthComponentID)).getValue(shipEntity);
    uint32 range = RangeComponent(LibUtils.addressById(world, RangeComponentID)).getValue(cannonEntity);

    Coord[] memory firingArea = LibCombat.getFiringArea(world, shipEntity, cannonEntity);

    Coord memory stern = LibVector.getSternPosition(startingPosition, rotation, length);
    Coord memory frontCorner = LibVector.getPositionByVector(
      startingPosition,
      rotation,
      range,
      (cannonRotation + 350) % 360
    );
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, cannonRotation + 10);

    assertCoordEq(startingPosition, firingArea[0]);
    logCoord("starting position:", startingPosition);
    logCoord("firing area 0", firingArea[0]);
    assertCoordEq(stern, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
    assertCoordEq(frontCorner, firingArea[3]);
  }

  function testFiringAreaPivot() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = spawnShip(gameId, startingPosition, 0, deployer);
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));
    address owner = rotationComponent.owner();

    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 0, 10, 80);

    uint32 rotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(shipEntity);
    uint32 cannonRotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(cannonEntity);
    uint32 range = RangeComponent(LibUtils.addressById(world, RangeComponentID)).getValue(cannonEntity);

    Coord[] memory firingArea = LibCombat.getFiringArea(world, shipEntity, cannonEntity);
    Coord memory frontCorner = LibVector.getPositionByVector(
      startingPosition,
      rotation,
      range,
      (cannonRotation + 350) % 360
    );
    Coord memory backCorner = LibVector.getPositionByVector(startingPosition, rotation, range, cannonRotation + 10);

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(frontCorner, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
  }

  function testFiringAreaPivotBehind() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = spawnShip(gameId, startingPosition, 0, deployer);
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));
    address owner = rotationComponent.owner();

    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 180, 10, 80);

    uint32 rotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(shipEntity);
    uint32 cannonRotation = RotationComponent(LibUtils.addressById(world, RotationComponentID)).getValue(cannonEntity);
    uint32 range = RangeComponent(LibUtils.addressById(world, RangeComponentID)).getValue(cannonEntity);
    uint32 length = LengthComponent(LibUtils.addressById(world, LengthComponentID)).getValue(shipEntity);
    Coord memory stern = LibVector.getSternPosition(startingPosition, rotation, length);

    Coord[] memory firingArea = LibCombat.getFiringArea(world, shipEntity, cannonEntity);
    Coord memory frontCorner = LibVector.getPositionByVector(stern, rotation, range, (cannonRotation + 350) % 360);
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, cannonRotation + 10);

    assertCoordEq(stern, firingArea[0]);
    assertCoordEq(frontCorner, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
  }

  function setup() private returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );
    return gameId;
  }
}
