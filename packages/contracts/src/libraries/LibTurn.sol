// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

//Components
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { GodID, GameConfig, Phase } from "./DSTypes.sol";

// Libraries
import "./LibUtils.sol";

library LibTurn {
  function getCurrentTurn(IWorld world) internal view returns (uint32) {
    return getTurnAt(world, block.timestamp);
  }

  function getTurnAt(IWorld world, uint256 atTime) internal view returns (uint32) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    require(atTime >= gameConfig.startTime, "invalid atTime");

    uint256 secondsSinceAction = atTime - gameConfig.startTime;
    uint256 _turnLength = gameConfig.commitPhaseLength + gameConfig.actionPhaseLength + gameConfig.revealPhaseLength;
    return uint32(secondsSinceAction / _turnLength);
  }

  function getCurrentPhase(IWorld world) internal view returns (Phase) {
    return getPhaseAt(world, block.timestamp);
  }

  function getPhaseAt(IWorld world, uint256 atTime) internal view returns (Phase) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    require(atTime >= gameConfig.startTime, "invalid atTime");

    uint256 gameLength = atTime - gameConfig.startTime;
    uint256 _turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;
    uint256 secondsIntoTurn = gameLength % _turnLength;

    if (secondsIntoTurn < gameConfig.commitPhaseLength) return Phase.Commit;
    else if (secondsIntoTurn < (gameConfig.commitPhaseLength + gameConfig.revealPhaseLength)) return Phase.Reveal;
    else return Phase.Action;
  }

  function getCurrentTurnAndPhase(IWorld world) internal view returns (uint32, Phase) {
    return getTurnAndPhaseAt(world, block.timestamp);
  }

  function getTurnAndPhaseAt(IWorld world, uint256 atTime) internal view returns (uint32, Phase) {
    uint32 turn = getTurnAt(world, atTime);
    Phase phase = getPhaseAt(world, atTime);
    return (turn, phase);
  }

  function turnLength(IWorld world) internal view returns (uint32) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    return gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;
  }

  function getTurnAndPhaseTime(
    IWorld world,
    uint32 turn,
    Phase phase
  ) internal view returns (uint256) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );

    uint256 startOffset = gameConfig.startTime;

    uint32 phaseOffset = 0;
    if (phase == Phase.Reveal) phaseOffset = gameConfig.commitPhaseLength;
    else if (phase == Phase.Action) phaseOffset = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength;

    uint32 turnOffset = turnLength(world) * turn;

    return startOffset + phaseOffset + turnOffset;
  }
}
