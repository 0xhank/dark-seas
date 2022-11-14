// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById, getSystemAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { Coord } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";

import "trig/src/Trigonometry.sol";

library LibPolygon {
  struct Line {
    Coord p1;
    Coord p2;
  }

  function getPositionByVector(
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

  function getShipSternAndAftLocation(IUint256Component components, uint256 shipEntityId)
    public
    returns (Coord memory, Coord memory)
  {
    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    require(shipComponent.has(shipEntityId), "LibPolygon: not a ship");

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    LengthComponent lengthComponent = LengthComponent(getAddressById(components, LengthComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint32 length = lengthComponent.getValue(shipEntityId);
    uint32 rotation = rotationComponent.getValue(shipEntityId);

    Coord memory shipPosition = positionComponent.getValue(shipEntityId);
    Coord memory sternPosition = getSternLocation(shipPosition, rotation, length);

    return (shipPosition, sternPosition);
  }

  function getSternLocation(
    Coord memory originPosition,
    uint32 rotation,
    uint32 length
  ) internal returns (Coord memory) {
    uint32 inverseRotation = rotation > 180 ? rotation - 180 : 180 - rotation;
    return getPositionByVector(originPosition, inverseRotation, length, 0);
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

  function inRange(
    Coord memory a,
    Coord memory b,
    uint32 range
  ) public returns (bool) {
    int32 distanceSquared = (a.x - b.x)**2 + (a.y - b.y)**2;

    return range**2 >= uint32(distanceSquared);
  }
}
