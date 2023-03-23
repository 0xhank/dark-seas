// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Components
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { GameConfig, Phase, GodID } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract LibTurnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  GameConfig gameConfig;

  function testGetCurrentTurn() public prank(deployer) {
    setup();
    uint32 turn = LibTurn.getCurrentTurn(world);

    assertEq(turn, 0);

    vm.warp(getTurnAndPhaseTime(world, 1, Phase.Commit));
    turn = LibTurn.getCurrentTurn(world);

    assertEq(LibTurn.getCurrentTurn(world), 1);

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Commit));

    assertEq(LibTurn.getCurrentTurn(world), 2);
  }

  function testGetCurrentPhase() public prank(deployer) {
    setup();

    Phase phase = LibTurn.getCurrentPhase(world);

    assertTrue(phase == Phase.Commit);

    vm.warp(getTurnAndPhaseTime(world, 1, Phase.Reveal));

    phase = LibTurn.getCurrentPhase(world);

    assertTrue(phase == Phase.Reveal);

    vm.warp(getTurnAndPhaseTime(world, 1, Phase.Action));

    phase = LibTurn.getCurrentPhase(world);

    assertTrue(phase == Phase.Action);
  }

  function testGetCurrentTurnAndPhase() public prank(deployer) {
    setup();

    (uint32 turn, Phase phase) = LibTurn.getCurrentTurnAndPhase(world);

    assertEq(turn, 0);
    assertTrue(phase == Phase.Commit);

    // turn length: 70, start time: 1, commit phase: 30 -> 101
    vm.warp(getTurnAndPhaseTime(world, 1, Phase.Reveal));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(world);
    assertEq(turn, 1, "incorrect turn");
    assertTrue(phase == Phase.Reveal, "incorrect phase");

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Action));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(world);
    assertEq(turn, 2, "incorrect turn");
    assertTrue(phase == Phase.Action, "incorrect phase");
  }

  function setup() private {
    gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(GodID);
  }
}
