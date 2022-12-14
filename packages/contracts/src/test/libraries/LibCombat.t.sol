// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";

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

  function testGetBaseHitChance() public {
    uint256 baseHitChance = LibCombat.getBaseHitChance(28, 50);
    assertApproxEqAbs(baseHitChance, 3200, 50, "baseHitChance: 28 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(0, 50);
    assertApproxEqAbs(baseHitChance, 4000, 50, "baseHitChance: 0 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(14, 90);
    assertApproxEqAbs(baseHitChance, 6437, 50, "baseHitChance: 14 and 90 failed");

    baseHitChance = LibCombat.getBaseHitChance(48, 5);
    assertApproxEqAbs(baseHitChance, 272, 50, "baseHitChance: 48 and 5 failed");
  }

  function testGetByteUInt() public {
    uint256 randomness = LibUtils.randomness(69, 420);

    uint256 byteUInt = LibUtils.getByteUInt(randomness, 0, 14);
    console.log("byte (0, 1):", byteUInt);

    byteUInt = LibUtils.getByteUInt(randomness, 15, 5);
    console.log("byte (5, 15):", byteUInt);

    byteUInt = LibUtils.getByteUInt(randomness, 40, 20);
    console.log("byte (40, 20):", byteUInt);
  }

  function testGetHullDamage() public {
    uint256 baseHitChance = 1000;
    uint256 threeDamage = (16384 * 999) / uint256(10000);
    uint256 twoDamage = (16384 * 1699) / uint256(10000);
    uint256 oneDamage = (16384 * 3499) / uint256(10000);
    uint256 zeroDamage = (16384 * 5501) / uint256(10000);

    assertEq(LibCombat.getHullDamage(baseHitChance, threeDamage), 3, "hull 3 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, twoDamage), 2, "hull 2 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, oneDamage), 1, "hull 1 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, zeroDamage), 0, "hull 0 failed");
  }

  function testGetCrewDamage() public {
    uint256 baseHitChance = 1000;
    uint256 threeDamage = ((499 << 14) * 16384) / uint256(10000); // 0x4E1C000
    uint256 twoDamage = ((999 << 14) * 16384) / uint256(10000);
    uint256 oneDamage = ((1999 << 14) * 16384) / uint256(10000);
    uint256 zeroDamage = ((2501 << 14) * 16384) / uint256(10000);

    assertEq(LibCombat.getCrewDamage(baseHitChance, threeDamage), 3, "crew 3 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, twoDamage), 2, "crew 2 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, oneDamage), 1, "crew 1 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, zeroDamage), 0, "crew 0 failed");
  }

  function testGetSpecialChance() public {
    uint256 baseHitChance = 10 * 100;
    uint256 tru = ((495 * 16384) / uint256(10000)) << (14 * 2); // 0x4E1C000
    uint256 fals = ((505 * 16384) / uint256(10000)) << (14 * 2);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, 1, tru, 0), "special 0 failed");
    assertTrue(!LibCombat.getSpecialChance(baseHitChance, 1, fals, 0), "special 0 failed");

    tru = ((495 * 16384) / uint256(10000)) << (14 * 3); // 0x4E1C000
    fals = ((505 * 16384) / uint256(10000)) << (14 * 3);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, 1, tru, 1), "special 1 failed");
    assertTrue(!LibCombat.getSpecialChance(baseHitChance, 1, fals, 1), "special 1 failed");
  }

  function testFiringArea() public prank(deployer) {
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = ShipSpawnSystem(system(ShipSpawnSystemID)).executeTyped(startingPosition, 0);

    console.log("deployer:", deployer);

    CannonComponent cannonComponent = CannonComponent(getAddressById(components, CannonComponentID));
    console.log("writer", cannonComponent.owner());

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 270, 50, 80);

    console.log("hello1");

    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(shipEntity);
    uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(shipEntity);
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);

    uint32 rightRange = (cannonRotation + 10) % 360;
    uint32 leftRange = (cannonRotation - 10) % 360;
    console.log("hello2");

    Coord[4] memory firingArea = LibCombat.getFiringAreaBroadside(components, shipEntity, cannonEntity);

    Coord memory stern = LibVector.getSternLocation(startingPosition, rotation, length);
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, leftRange);
    Coord memory frontCorner = LibVector.getPositionByVector(startingPosition, rotation, range, rightRange);
    console.log("hello3");

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(stern, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
    assertCoordEq(frontCorner, firingArea[3]);
  }

  function testFiringAreaUpsideDown() public prank(deployer) {
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = ShipSpawnSystem(system(ShipSpawnSystemID)).executeTyped(startingPosition, 180);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(shipEntity);
    uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(shipEntity);
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);

    Coord[4] memory firingArea = LibCombat.getFiringAreaBroadside(components, shipEntity, cannonEntity);

    Coord memory stern = LibVector.getSternLocation(startingPosition, rotation, length);
    Coord memory frontCorner = LibVector.getPositionByVector(
      startingPosition,
      rotation,
      range,
      (cannonRotation + 350) % 360
    );
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, cannonRotation + 10);

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(stern, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
    assertCoordEq(frontCorner, firingArea[3]);
  }

  function testFiringAreaPivot() public prank(deployer) {
    // setUp();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = ShipSpawnSystem(system(ShipSpawnSystemID)).executeTyped(startingPosition, 0);
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    address owner = rotationComponent.owner();
    console.log("owner:", owner);
    console.log("deployer:", deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 0, 50, 80);

    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(shipEntity);
    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);

    Coord[3] memory firingArea = LibCombat.getFiringAreaPivot(components, shipEntity, cannonEntity);
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
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = ShipSpawnSystem(system(ShipSpawnSystemID)).executeTyped(startingPosition, 0);
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    address owner = rotationComponent.owner();
    console.log("owner:", owner);
    console.log("deployer:", deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 180, 50, 80);

    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(shipEntity);
    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(cannonEntity);
    uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(shipEntity);
    Coord memory stern = LibVector.getSternLocation(startingPosition, rotation, length);

    Coord[3] memory firingArea = LibCombat.getFiringAreaPivot(components, shipEntity, cannonEntity);
    Coord memory frontCorner = LibVector.getPositionByVector(stern, rotation, range, (cannonRotation + 350) % 360);
    Coord memory backCorner = LibVector.getPositionByVector(stern, rotation, range, cannonRotation + 10);

    assertCoordEq(stern, firingArea[0]);
    assertCoordEq(frontCorner, firingArea[1]);
    assertCoordEq(backCorner, firingArea[2]);
  }

  function testFiringAreaForward() public prank(deployer) {
    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntity = ShipSpawnSystem(system(ShipSpawnSystemID)).executeTyped(startingPosition, 0);

    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(shipEntity);
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(shipEntity);

    Coord[3] memory firingArea = LibCombat.getFiringAreaForward(components, shipEntity);
    Coord memory leftCorner = LibVector.getPositionByVector(startingPosition, rotation, range, 10);
    Coord memory rightCorner = LibVector.getPositionByVector(startingPosition, rotation, range, 350);

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(rightCorner, firingArea[1]);
    assertCoordEq(leftCorner, firingArea[2]);
  }
}
