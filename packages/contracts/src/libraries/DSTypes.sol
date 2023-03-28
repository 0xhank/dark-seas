// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "std-contracts/components/CoordComponent.sol";

uint256 constant GodID = uint256(0x060D);

struct MoveCard {
  uint32 distance;
  uint32 direction;
  uint32 rotation;
}

struct Line {
  Coord start;
  Coord end;
}

struct Action {
  uint256 shipEntity;
  bytes[2] actions;
  bytes[2] metadata;
}

struct Move {
  uint256 shipEntity;
  uint256 moveCardEntity;
}

enum Phase {
  Commit,
  Reveal,
  Action
}

struct Upgrade {
  uint256 componentId;
  uint32 amount;
}

struct GameConfig {
  // Block timestamp when the game started
  uint256 startTime;
  // Number of seconds
  uint32 commitPhaseLength;
  uint32 revealPhaseLength;
  uint32 actionPhaseLength;
  uint32 worldSize;
  int32 perlinSeed;
  // Number of turns before registration is blocked
  uint32 entryCutoffTurns;
  uint256 buyin;
  // Calculation: Every turn, the world shrinks by gameConfig.shrinkrate / 100.
  // If shrink rate is 100, the world will shrink by 1 each turn.
  // Shrinking starts once entry is cutoff and ends when the world size is 50.
  uint32 shrinkRate;
  uint32 budget;
  uint8 islandThreshold;
}

struct ShipPrototype {
  uint32 price;
  uint32 length;
  uint32 maxHealth;
  uint32 speed;
  CannonPrototype[] cannons;
  string name;
}

struct CannonPrototype {
  uint32 rotation;
  uint32 firepower;
  uint32 range;
}
