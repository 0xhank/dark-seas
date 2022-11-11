// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { Coord } from "../components/PositionComponent.sol";

import "trig/src/Trigonometry.sol";

library LibPolygon {
  struct Line {
    Coord p1;
    Coord p2;
  }

  function calculatePositionByVector(
    Coord memory initialPosition,
    uint32 initialRotation,
    uint32 moveDistance,
    uint32 moveAngle
  ) internal returns (Coord memory) {
    uint32 angleDegs = (initialRotation + moveAngle) % 360;

    uint256 angleRadsTimes10000 = uint256(angleDegs * 1745);

    uint256 angleRadsConverted = angleRadsTimes10000 * 1e13 + Trigonometry.TWO_PI;

    int256 newX = Trigonometry.cos(angleRadsConverted) * int32(moveDistance);

    int256 newY = Trigonometry.sin(angleRadsConverted) * int32(moveDistance);

    int256 unconvertedX = newX / 1e18;
    int256 unconvertedY = newY / 1e18;

    return Coord({ x: int32(unconvertedX) + initialPosition.x, y: int32(unconvertedY) + initialPosition.y });
  }

  function direction(
    Coord memory a,
    Coord memory b,
    Coord memory c
  ) public returns (uint32) {
    int32 val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    if (val == 0) return 0;
    if (val < 0) return 2;
    return 1;
  }

  function onLine(Line memory l1, Coord memory p) public returns (bool) {
    if (
      p.x <= max(l1.p1.x, l1.p2.x) &&
      p.x <= min(l1.p1.x, l1.p2.x) &&
      p.y <= max(l1.p1.y, l1.p2.y) &&
      p.y <= min(l1.p1.y, l1.p2.y)
    ) {
      return true;
    }
    return false;
  }

  function isIntersect(Line memory l1, Line memory l2) public returns (bool) {
    uint32 dir1 = direction(l1.p1, l1.p2, l2.p1);
    uint32 dir2 = direction(l1.p1, l1.p2, l2.p2);
    uint32 dir3 = direction(l2.p1, l2.p2, l1.p1);
    uint32 dir4 = direction(l2.p1, l2.p2, l1.p2);

    if (dir1 != dir2 && dir3 != dir4) return true;
    if (dir1 == 0 && onLine(l1, l2.p1)) return true;
    if (dir2 == 0 && onLine(l1, l2.p2)) return true;
    if (dir3 == 0 && onLine(l2, l1.p1)) return true;
    if (dir4 == 0 && onLine(l2, l1.p2)) return true;
    return false;
  }

  function checkInside(Coord[4] memory coords, Coord memory p) public returns (bool) {
    Line memory exline = Line({ p1: p, p2: Coord({ x: 65535, y: p.y }) });
    uint32 count = 0;
    uint32 i = 0;
    do {
      uint32 iPlusOne = i == 3 ? 0 : i + 1;
      Line memory side = Line({ p1: coords[i], p2: coords[iPlusOne] });
      if (isIntersect(side, exline)) {
        if (direction(side.p1, p, side.p2) == 0) return onLine(side, p);
        count++;
      }
      i = iPlusOne;
    } while (i != 0);

    return count % 2 == 1;
  }

  function max(int32 a, int32 b) public returns (int32) {
    return a > b ? a : b;
  }

  function min(int32 a, int32 b) public returns (int32) {
    return a < b ? a : b;
  }
}
