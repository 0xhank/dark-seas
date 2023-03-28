// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Components
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { InitSystem, ID as InitSystemID } from "../../systems/InitSystem.sol";

// Types
import { GameConfig, Phase } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract LibTurnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  GameConfig gameConfig;

  function testGetCurrentTurn() public prank(deployer) {
    uint256 gameId = setup();
    uint32 turn = LibTurn.getCurrentTurn(world, gameId);

    assertEq(turn, 0);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Commit));
    turn = LibTurn.getCurrentTurn(world, gameId);

    assertEq(LibTurn.getCurrentTurn(world, gameId), 1);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Commit));

    assertEq(LibTurn.getCurrentTurn(world, gameId), 2);
  }

  function testGetCurrentPhase() public prank(deployer) {
    uint256 gameId = setup();

    Phase phase = LibTurn.getCurrentPhase(world, gameId);

    assertTrue(phase == Phase.Commit);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Reveal));

    phase = LibTurn.getCurrentPhase(world, gameId);

    assertTrue(phase == Phase.Reveal);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    phase = LibTurn.getCurrentPhase(world, gameId);

    assertTrue(phase == Phase.Action);
  }

  function testGetCurrentTurnAndPhase() public prank(deployer) {
    uint256 gameId = setup();

    (uint32 turn, Phase phase) = LibTurn.getCurrentTurnAndPhase(world, gameId);

    assertEq(turn, 0);
    assertTrue(phase == Phase.Commit);

    // turn length: 70, start time: 1, commit phase: 30 -> 101
    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Reveal));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(world, gameId);
    assertEq(turn, 1, "incorrect turn");
    assertTrue(phase == Phase.Reveal, "incorrect phase");

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    (turn, phase) = LibTurn.getCurrentTurnAndPhase(world, gameId);
    assertEq(turn, 2, "incorrect turn");
    assertTrue(phase == Phase.Action, "incorrect phase");
  }

  function setup() private returns (uint256 gameId) {
    bytes memory id = InitSystem(system(InitSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(gameId);
    return gameId;
  }
}
