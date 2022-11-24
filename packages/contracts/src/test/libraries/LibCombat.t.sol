// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// Internal
import "../../libraries/LibVector.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { LibCombat } from "../../libraries/LibCombat.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";

import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";
import { Coord } from "../../components/PositionComponent.sol";

contract LibCombatTest is MudTest {
  function testGetBaseHitChance() public prank(deployer) {
    uint256 baseHitChance = LibCombat.getBaseHitChance(28, 50);
    assertApproxEqAbs(baseHitChance, 1100, 50, "baseHitChance: 28 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(0, 50);
    assertApproxEqAbs(baseHitChance, 2500, 50, "baseHitChance: 0 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(14, 90);
    assertApproxEqAbs(baseHitChance, 3000, 50, "baseHitChance: 14 and 90 failed");

    baseHitChance = LibCombat.getBaseHitChance(48, 5);
    assertApproxEqAbs(baseHitChance, 100, 50, "baseHitChance: 48 and 5 failed");
  }

  function testGetByteUInt() public prank(deployer) {
    uint256 randomness = LibCombat.randomness(69, 420);

    uint256 byteUInt = LibCombat.getByteUInt(randomness, 0, 14);
    console.log("byte (0, 1):", byteUInt);

    byteUInt = LibCombat.getByteUInt(randomness, 15, 5);
    console.log("byte (5, 15):", byteUInt);

    byteUInt = LibCombat.getByteUInt(randomness, 40, 20);
    console.log("byte (40, 20):", byteUInt);
  }

  function testGetHullDamage() public prank(deployer) {
    uint256 baseHitChance = 10 * 100;
    uint256 threeDamage = 999;
    uint256 twoDamage = 2699;
    uint256 oneDamage = 4499;
    uint256 zeroDamage = 5501;

    assertEq(LibCombat.getHullDamage(baseHitChance, threeDamage), 3, "hull 3 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, twoDamage), 2, "hull 2 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, oneDamage), 1, "hull 1 failed");
    assertEq(LibCombat.getHullDamage(baseHitChance, zeroDamage), 0, "hull 0 failed");
  }

  function testGetCrewDamage() public prank(deployer) {
    uint256 baseHitChance = 10 * 100;
    uint256 threeDamage = 499 << 14; // 0x4E1C000
    uint256 twoDamage = 999 << 14;
    uint256 oneDamage = 2499 << 14;
    uint256 zeroDamage = 2501 << 14;

    assertEq(LibCombat.getCrewDamage(baseHitChance, threeDamage), 3, "crew 3 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, twoDamage), 2, "crew 2 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, oneDamage), 1, "crew 1 failed");
    assertEq(LibCombat.getCrewDamage(baseHitChance, zeroDamage), 0, "crew 0 failed");
  }

  function testGetSpecialChance() public prank(deployer) {
    uint256 baseHitChance = 10 * 100;
    uint256 tru = 499 << (14 * 2); // 0x4E1C000
    uint256 fals = 501 << (14 * 2);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, tru, 0), "special 0 failed");
    assertTrue(!LibCombat.getSpecialChance(baseHitChance, fals, 0), "special 0 failed");

    tru = 499 << (14 * 3); // 0x4E1C000
    fals = 501 << (14 * 3);

    assertTrue(LibCombat.getSpecialChance(baseHitChance, tru, 1), "special 1 failed");
    assertTrue(!LibCombat.getSpecialChance(baseHitChance, fals, 1), "special 1 failed");
  }
}
