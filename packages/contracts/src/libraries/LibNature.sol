// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById, getSystemAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { Coord } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { Wind } from "../components/WindComponent.sol";

import { console } from "forge-std/console.sol";

import "trig/src/Trigonometry.sol";

library LibNature {
  function getWindBoost(Wind memory wind, uint32 rotation) public pure returns (int32) {
    uint32 rotationDiff = wind.direction > rotation ? wind.direction - rotation : rotation - wind.direction;
    int32 windSpeed = int32(wind.speed);
    if (rotationDiff < 21 || rotationDiff > 339 || (rotationDiff > 120 && rotationDiff <= 240)) return -windSpeed;
    if (rotationDiff < 80 || rotationDiff > 280) return windSpeed;
    return 0;
  }

  function getMoveDistanceWithWind(
    uint32 moveDistance,
    uint32 rotation,
    Wind memory wind
  ) public pure returns (uint32) {
    int32 windBoost = getWindBoost(wind, rotation);

    uint32 moveDistance = -windBoost >= int32(moveDistance) ? 0 : uint32(int32(moveDistance) + windBoost);

    return moveDistance;
  }
}
