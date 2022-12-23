// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

// Components
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { GodID, GameConfig, Phase } from "../libraries/DSTypes.sol";

library LibTurn {
  function getCurrentTurn(IUint256Component components) internal view returns (uint32) {
    return getTurnAt(components, block.timestamp);
  }

  function getTurnAt(IUint256Component components, uint256 atTime) internal view returns (uint32) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    require(atTime >= gameConfig.startTime, "invalid atTime");

    uint256 secondsSinceAction = atTime - gameConfig.startTime;
    uint256 _turnLength = gameConfig.commitPhaseLength + gameConfig.actionPhaseLength + gameConfig.revealPhaseLength;
    return uint32(secondsSinceAction / _turnLength);
  }

  function getCurrentPhase(IUint256Component components) internal view returns (Phase) {
    return getPhaseAt(components, block.timestamp);
  }

  function getPhaseAt(IUint256Component components, uint256 atTime) internal view returns (Phase) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
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

  function getCurrentTurnAndPhase(IUint256Component components) internal view returns (uint32, Phase) {
    return getTurnAndPhaseAt(components, block.timestamp);
  }

  function getTurnAndPhaseAt(IUint256Component components, uint256 atTime) internal view returns (uint32, Phase) {
    uint32 turn = getTurnAt(components, atTime);
    Phase phase = getPhaseAt(components, atTime);
    return (turn, phase);
  }

  function turnLength(IUint256Component components) internal view returns (uint32) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    return gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;
  }

  function getTurnAndPhaseTime(
    IUint256Component components,
    uint32 turn,
    Phase phase
  ) internal view returns (uint256) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    uint256 startOffset = gameConfig.startTime;

    uint32 phaseOffset = 0;
    if (phase == Phase.Reveal) phaseOffset = gameConfig.commitPhaseLength;
    else if (phase == Phase.Action) phaseOffset = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength;

    uint32 turnOffset = turnLength(components) * turn;

    return startOffset + phaseOffset + turnOffset;
  }
}
