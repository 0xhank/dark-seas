// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "std-contracts/components/CoordComponent.sol";

uint256 constant GodID = uint256(0x060D);

struct MoveCard {
  uint32 distance;
  uint32 direction;
  uint32 rotation;
}

struct Action {
  uint256 shipEntity;
  ActionType[2] actionTypes;
  bytes[2] metadata;
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
  RepairCannons,
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
  uint32 worldSize;
  int128 perlinSeed;
  uint256[] shipPrototypes;
  // Amount of time for players to enter game
  uint32 entryCutoffTurns;
  uint256 buyin;
  bool respawnAllowed;
}

struct ShipPrototype {
  uint32 length;
  uint32 maxHealth;
  uint32 speed;
  CannonPrototype[] cannons;
}

struct CannonPrototype {
  uint32 rotation;
  uint32 firepower;
  uint32 range;
}
