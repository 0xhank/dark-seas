// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// Internal
import "../../libraries/LibVector.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { LibCombat } from "../../libraries/LibCombat.sol";

contract LibCombatTest is MudTest {
  function testGetBaseHitChance() public prank(deployer) {
    uint256 distance = 28;
    uint256 firepower = 50;
    uint256 baseHitChance = LibCombat.getBaseHitChance(28, 50);
    assertApproxEqAbs(baseHitChance, 11, 1, "baseHitChance: 28 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(0, 50);
    assertApproxEqAbs(baseHitChance, 25, 1, "baseHitChance: 0 and 50 failed");

    baseHitChance = LibCombat.getBaseHitChance(14, 90);
    assertApproxEqAbs(baseHitChance, 30, 1, "baseHitChance: 14 and 90 failed");

    baseHitChance = LibCombat.getBaseHitChance(48, 5);
    assertApproxEqAbs(baseHitChance, 1, 1, "baseHitChance: 48 and 5 failed");
  }
}
