// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById, getSystemAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";

import { MoveCard, Wind, Coord } from "./DSTypes.sol";

import { console } from "forge-std/console.sol";

import "trig/src/Trigonometry.sol";

library LibMove {
  function windBoost(Wind memory wind, uint32 rotation) public pure returns (int32) {
    uint32 rotationDiff = wind.direction > rotation ? wind.direction - rotation : rotation - wind.direction;
    int32 windSpeed = int32(wind.speed);
    if (rotationDiff > 120 && rotationDiff <= 240) return -windSpeed;
    if (rotationDiff < 80 || rotationDiff > 280) return windSpeed;
    return 0;
  }

  function getMoveWithWind(
    MoveCard memory moveCard,
    uint32 rotation,
    Wind memory wind
  ) public pure returns (MoveCard memory) {
    // if 0, +-0% if 10, +- 25% if 20 , +-50%
    int32 windBoost = (windBoost(wind, rotation) * 100) / 40;
    return getMoveWithBuff(moveCard, uint32(windBoost + 100));
  }

  function getMoveWithSails(MoveCard memory moveCard, uint32 sailPosition) public pure returns (MoveCard memory) {
    if (sailPosition == 3) {
      return getMoveWithBuff(moveCard, 100);
    }

    if (sailPosition == 2) {
      return getMoveWithBuff(moveCard, 70);
    }

    if (sailPosition == 1) {
      return getMoveWithBuff(moveCard, 40);
    }

    return MoveCard(0, 0, 0);
  }

  function getMoveWithBuff(MoveCard memory moveCard, uint32 buff) public pure returns (MoveCard memory) {
    if (buff == 100) return moveCard;
    if (buff == 0) return MoveCard(0, 0, 0);

    moveCard.distance = (moveCard.distance * buff) / 100;

    if (moveCard.rotation > 180) {
      moveCard.rotation = 360 - (((360 - moveCard.rotation) * buff) / 100);
    } else {
      moveCard.rotation = (moveCard.rotation * buff) / 100;
    }

    if (moveCard.direction > 180) {
      moveCard.direction = 360 - (((360 - moveCard.direction) * buff) / 100);
    } else {
      moveCard.direction = (moveCard.direction * buff) / 100;
    }
    return moveCard;
  }
}
