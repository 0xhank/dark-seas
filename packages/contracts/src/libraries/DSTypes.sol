// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "std-contracts/components/CoordComponent.sol";

uint256 constant GodID = uint256(0x060D);

struct Wind {
  uint32 speed;
  uint32 direction;
}

struct MoveCard {
  uint32 distance;
  uint32 direction;
  uint32 rotation;
}

struct Action {
  uint256 shipEntity;
  ActionType[2] actionTypes;
  uint256[2] specialEntities;
}

struct Move {
  uint256 shipEntity;
  uint256 moveCardEntity;
}

enum ActionType {
  None,
  Load,
  Fire,
  RaiseSail,
  LowerSail,
  ExtinguishFire,
  RepairMast,
  RepairSail
}

enum Side {
  Forward,
  Right,
  Left
}

enum Phase {
  Commit,
  Reveal,
  Action
}

struct GameConfig {
  // Block timestamp when the game started
  uint256 startTime;
  // Number of seconds
  uint32 commitPhaseLength;
  uint32 revealPhaseLength;
  uint32 actionPhaseLength;
  uint32 worldRadius;
}
