// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById, getSystemAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { Coord } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { ABDKMath64x64 as Math } from "./ABDKMath64x64.sol";

import "trig/src/Trigonometry.sol";

library LibVector {
  function getPositionByVector(
    Coord memory initialPosition,
    uint32 initialRotation,
    uint32 moveDistance,
    uint32 moveDirection
  ) internal returns (Coord memory) {
    uint32 angleDegs = (initialRotation + moveDirection) % 360;

    uint256 angleRadsTimes10000 = uint256(angleDegs * 1745);

    uint256 angleRadsConverted = angleRadsTimes10000 * 1e13 + Trigonometry.TWO_PI;

    int256 newX = Trigonometry.cos(angleRadsConverted) * int32(moveDistance);

    int256 newY = Trigonometry.sin(angleRadsConverted) * int32(moveDistance);

    int32 finalX = int32(newX / 1e18) + initialPosition.x;
    int32 finalY = int32(newY / 1e18) + initialPosition.y;

    return Coord({ x: finalX, y: finalY });
  }

  function getShipBowAndSternLocation(IUint256Component components, uint256 shipEntityId)
    public
    returns (Coord memory, Coord memory)
  {
    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    require(shipComponent.has(shipEntityId), "LibVector: not a ship");

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
    return getPositionByVector(originPosition, rotation, length, 180);
  }

  // uses the winding algorithm to calculate if point is within the polygon comprised of coords
  function withinPolygon(Coord[4] memory coords, Coord memory point) public returns (bool) {
    int32 wn = 0;
    for (uint32 i = 0; i < 4; i++) {
      Coord memory point1 = coords[i];
      Coord memory point2 = i == 3 ? coords[0] : coords[i + 1];

      int32 isLeft = ((point2.x - point1.x) * (point.y - point1.y)) - ((point.x - point1.x) * (point2.y - point1.y));
      if (isLeft == 0) return false;
      if (point1.y <= point.y && point2.y > point.y && isLeft > 0) wn++;
      else if (point1.y > point.y && point2.y <= point.y && isLeft < 0) wn--;
    }
    return wn != 0;
  }

  function inRange(
    Coord memory a,
    Coord memory b,
    uint32 range
  ) public returns (bool) {
    int32 distanceSquared = (a.x - b.x)**2 + (a.y - b.y)**2;

    return range**2 >= uint32(distanceSquared);
  }

  function distance(Coord memory a, Coord memory b) public returns (uint256) {
    int128 distanceSquared = (a.x - b.x)**2 + (a.y - b.y)**2;
    return Math.toUInt(Math.sqrt(Math.fromInt(distanceSquared)));
  }
}
