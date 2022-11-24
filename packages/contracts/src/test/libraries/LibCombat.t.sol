// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// Internal
import "../../libraries/LibVector.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { LibCombat } from "../../libraries/LibCombat.sol";

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
}
