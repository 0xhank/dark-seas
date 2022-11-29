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

enum Action {
  FireRight,
  FireLeft,
  RaiseSail,
  LowerSail,
  ExtinguishFire,
  RepairLeak,
  RepairMast,
  RepairSail
}

enum Side {
  Right,
  Left
}
