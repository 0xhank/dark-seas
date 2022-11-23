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
}
