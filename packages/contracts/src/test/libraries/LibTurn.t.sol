// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

import "../MudTest.t.sol";
import { GameConfig, Phase } from "../../libraries/DSTypes.sol";
import "../../libraries/LibTurn.sol";

contract LibTurnTest is MudTest {
  GameConfigComponent gameConfigComponent;

  function testGetCurrentTurn() public prank(deployer) {
    uint32 turn = LibTurn.getCurrentTurn(components);

    assertEq(turn, 0);

    vm.warp(121);

    turn = LibTurn.getCurrentTurn(components);

    assertEq(turn, 1);
  }

  function testGetCurrentPhase() public prank(deployer) {
    Phase phase = LibTurn.getCurrentPhase(components);

    assertTrue(phase == Phase.Move);

    vm.warp(76);

    phase = LibTurn.getCurrentPhase(components);

    assertTrue(phase == Phase.Action);
  }

  function testGetCurrentTurnAndPhase() public prank(deployer) {
    (uint32 turn, Phase phase) = LibTurn.getCurrentTurnAndPhase(components);

    assertEq(turn, 0);
    assertTrue(phase == Phase.Move);

    vm.warp(196);

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(components);

    assertEq(turn, 1);
    assertTrue(phase == Phase.Action);
  }

  function setup() private {
    gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
  }
}
