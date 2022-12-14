// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { addressToEntity } from "solecs/utils.sol";
import "../MudTest.t.sol";

// Libraries
import "../../libraries/LibCombat.sol";
import "../../libraries/LibUtils.sol";

contract LibCombatTest is MudTest {
  function testGetBaseHitChance() public prank(deployer) {
    uint256 baseHitChance = LibCombat.getBaseHitChance(28, 50);
    assertApproxEqAbs(baseHitChance, 3200, 50, "baseHitChance: 28 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(0, 50);
    assertApproxEqAbs(baseHitChance, 4000, 50, "baseHitChance: 0 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(14, 90);
    assertApproxEqAbs(baseHitChance, 6437, 50, "baseHitChance: 14 and 90 failed");

    baseHitChance = LibCombat.getBaseHitChance(48, 5);
    assertApproxEqAbs(baseHitChance, 272, 50, "baseHitChance: 48 and 5 failed");
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
    uint256 zeroDamage = (16384 * 5501) / uint256(10000);

    assertEq(LibCombat.getHullDamage(baseHitChance, threeDamage), 3, "hull 3 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, twoDamage), 2, "hull 2 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, oneDamage), 1, "hull 1 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, zeroDamage), 0, "hull 0 failed");
  }

  function testGetCrewDamage() public prank(deployer) {
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

  function testGetSpecialChance() public prank(deployer) {
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
}
