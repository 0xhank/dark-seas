// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { console } from "forge-std/console.sol";

import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
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
    uint256 turnLength = gameConfig.commitPhaseLength + gameConfig.actionPhaseLength + gameConfig.revealPhaseLength;
    return uint32(secondsSinceAction / turnLength);
  }

  function getCurrentPhase(IUint256Component components) internal view returns (Phase) {
    return getPhaseAt(components, block.timestamp);
  }

  function getPhaseAt(IUint256Component components, uint256 atTime) internal view returns (Phase) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    require(atTime >= gameConfig.startTime, "invalid atTime");

    uint256 secondsSinceAction = atTime - gameConfig.startTime;
    uint256 turnLength = gameConfig.commitPhaseLength + gameConfig.actionPhaseLength + gameConfig.commitPhaseLength;
    uint256 secondsIntoTurn = secondsSinceAction % turnLength;

    if (secondsIntoTurn < gameConfig.commitPhaseLength) return Phase.Commit;
    else if (secondsIntoTurn < gameConfig.commitPhaseLength + gameConfig.revealPhaseLength) return Phase.Reveal;
    else return Phase.Action;
  }

  function getCurrentTurnAndPhase(IUint256Component components) internal view returns (uint32, Phase) {
    return getTurnAndPhaseAt(components, block.timestamp);
  }

  function getTurnAndPhaseAt(IUint256Component components, uint256 atTime) internal view returns (uint32, Phase) {
    uint32 turn = getCurrentTurn(components);
    Phase phase = getCurrentPhase(components);
    return (turn, phase);
  }
}
