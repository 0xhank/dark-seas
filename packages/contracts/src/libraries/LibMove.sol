// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";

// Types
import { MoveCard, Wind, Coord } from "./DSTypes.sol";

// Libraries
import "../libraries/LibVector.sol";
import "trig/src/Trigonometry.sol";

library LibMove {
  /**
   * @notice  calculates boost from wind
   * @param   wind  current wind direction and intensity
   * @param   rotation  of selected ship
   * @return  int32  effect of wind
   */
  function windBoost(Wind memory wind, uint32 rotation) public pure returns (int32) {
    uint32 rotationDiff = wind.direction > rotation ? wind.direction - rotation : rotation - wind.direction;
    int32 windSpeed = int32(wind.speed);
    if (rotationDiff > 120 && rotationDiff <= 240) return -windSpeed;
    if (rotationDiff < 80 || rotationDiff > 280) return windSpeed;
    return 0;
  }

  /**
   * @notice  calculates modified move card based on wind
   * @dev  if boost is 0, +-0% else if 10, +- 25% else if 20 , +-50%
   * @param   moveCard  original move card
   * @param   rotation  of selected ship
   * @param   wind  current wind direction and intensity
   * @return  MoveCard  updated move card
   */
  function getMoveWithWind(
    MoveCard memory moveCard,
    uint32 rotation,
    Wind memory wind
  ) public pure returns (MoveCard memory) {
    int32 _windBoost = (windBoost(wind, rotation) * 100) / 40;
    return getMoveWithBuff(moveCard, uint32(_windBoost + 100));
  }

  /**
   * @notice  calculates modified move card based on sail position
   * @param   moveCard  original move card
   * @param   sailPosition ship's current sail position
   * @return  MoveCard  updated move card
   */
  function getMoveWithSails(MoveCard memory moveCard, uint32 sailPosition) public pure returns (MoveCard memory) {
    if (sailPosition == 2) {
      return getMoveWithBuff(moveCard, 100);
    }

    if (sailPosition == 1) {
      return getMoveWithBuff(moveCard, 33);
    }

    return MoveCard(0, 0, 0);
  }

  /**
   * @notice  calculates updated move data based on card
   * @param   moveCard  original card
   * @param   buff  update to apply
   * @return  MoveCard  updated move card
   */
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

  /**
   * @notice  moves a ship
   * @param   components  world components
   * @param   shipEntity  to move
   * @param   playerEntity  owner of ship
   * @param   moveCardEntity  move to apply
   * @param   wind  direction and intensity of wind
   */
  function moveShip(
    IUint256Component components,
    uint256 shipEntity,
    uint256 playerEntity,
    uint256 moveCardEntity,
    Wind memory wind
  ) public {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    require(
      HealthComponent(getAddressById(components, HealthComponentID)).getValue(shipEntity) > 0,
      "MoveSystem: ship is sunk"
    );

    require(
      CrewCountComponent(getAddressById(components, CrewCountComponentID)).getValue(shipEntity) > 0,
      "MoveSystem: ship has no crew"
    );

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(shipEntity) == playerEntity,
      "MoveSystem: you don't own this ship"
    );
    require(moveCardComponent.has(moveCardEntity), "MoveSystem: invalid move card entity id");
    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(shipEntity),
      "MoveSystem: invalid ship entity id"
    );

    // calculate move card with wind and sail modifiers
    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    Coord memory position = positionComponent.getValue(shipEntity);
    uint32 rotation = rotationComponent.getValue(shipEntity);

    moveCard = getMoveWithWind(moveCard, rotation, wind);

    moveCard = getMoveWithSails(
      moveCard,
      SailPositionComponent(getAddressById(components, SailPositionComponentID)).getValue(shipEntity)
    );

    position = LibVector.getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);

    require(LibVector.inWorldRadius(components, position), "MoveSystem: move out of bounds");
    rotation = (rotation + moveCard.rotation) % 360;

    positionComponent.set(shipEntity, position);
    rotationComponent.set(shipEntity, rotation);
  }
}
