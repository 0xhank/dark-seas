// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

import "../MudTest.t.sol";
import { GameConfig, Phase, GodID } from "../../libraries/DSTypes.sol";
import "../../libraries/LibTurn.sol";

contract LibTurnTest is MudTest {
  GameConfig gameConfig;

  function testGetCurrentTurn() public prank(deployer) {
    setup();
    uint32 turn = LibTurn.getCurrentTurn(components);
    uint32 turnLength = LibTurn.turnLength(components);

    assertEq(turn, 0);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    turn = LibTurn.getCurrentTurn(components);

    assertEq(LibTurn.getCurrentTurn(components), 1);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Commit));

    assertEq(LibTurn.getCurrentTurn(components), 2);
  }

  function testGetCurrentPhase() public prank(deployer) {
    setup();

    Phase phase = LibTurn.getCurrentPhase(components);

    assertTrue(phase == Phase.Commit);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    phase = LibTurn.getCurrentPhase(components);

    assertTrue(phase == Phase.Reveal);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    phase = LibTurn.getCurrentPhase(components);

    assertTrue(phase == Phase.Action);
  }

  function testGetCurrentTurnAndPhase() public prank(deployer) {
    setup();

    (uint32 turn, Phase phase) = LibTurn.getCurrentTurnAndPhase(components);

    uint32 turnLength = LibTurn.turnLength(components);

    assertEq(turn, 0);
    assertTrue(phase == Phase.Commit);

    // turn length: 70, start time: 1, commit phase: 30 -> 101
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(components);
    assertEq(turn, 1, "incorrect turn");
    assertTrue(phase == Phase.Reveal, "incorrect phase");

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(components);
    assertEq(turn, 2, "incorrect turn");
    assertTrue(phase == Phase.Action, "incorrect phase");
  }

  function setup() private {
    gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(GodID);
  }
}
