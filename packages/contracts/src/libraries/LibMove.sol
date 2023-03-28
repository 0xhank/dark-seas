// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { Perlin } from "noise/Perlin.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../components/SpeedComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";

// Types
import { MoveCard, Move, Coord } from "./DSTypes.sol";

// Libraries
import "../libraries/LibVector.sol";
import "../libraries/LibCombat.sol";
import "../libraries/LibUtils.sol";
import "trig/src/Trigonometry.sol";

library LibMove {
  /**
   * @notice  calculates modified move card based on sail position
   * @param   moveCard  original move card
   * @param   sailPosition ship's current sail position
   * @return  MoveCard  updated move card
   */
  function getMoveWithSails(
    MoveCard memory moveCard,
    uint32 shipSpeed,
    uint32 sailPosition
  ) public pure returns (MoveCard memory) {
    moveCard.distance = (moveCard.distance * shipSpeed) / 10;
    if (sailPosition == 2) {
      return getMoveWithBuff(moveCard, 100);
    }

    if (sailPosition == 1) {
      return getMoveWithBuff(moveCard, 70);
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
      moveCard.rotation = 360 - (((360 - moveCard.rotation) * 100) / buff);
    } else {
      moveCard.rotation = (moveCard.rotation * 100) / buff;
    }

    if (moveCard.direction > 180) {
      moveCard.direction = 360 - (((360 - moveCard.direction) * 100) / buff);
    } else {
      moveCard.direction = (moveCard.direction * 100) / buff;
    }
    return moveCard;
  }

  /**
   * @notice  moves a ship
   * @param   world world and components
   * @param   move  move to execute
   * @param   playerEntity  owner of ship
   */
  /**
   * @notice  .
   * @dev     .
   * @param   world  .
   * @param   gameId  .
   * @param   move  .
   * @param   playerEntity  .
   */
  function moveShip(IWorld world, uint256 gameId, Move memory move, uint256 playerEntity) public {
    MoveCardComponent moveCardComponent = MoveCardComponent(LibUtils.addressById(world, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      LibUtils.addressById(world, SailPositionComponentID)
    );

    require(
      CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).getValue(move.shipEntity) == gameId,
      "MoveSystem: ship is not in current game"
    );

    require(
      HealthComponent(LibUtils.addressById(world, HealthComponentID)).getValue(move.shipEntity) > 0,
      "MoveSystem: ship is sunk"
    );

    require(
      OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).getValue(move.shipEntity) == playerEntity,
      "MoveSystem: you don't own this ship"
    );
    require(moveCardComponent.has(move.moveCardEntity), "MoveSystem: invalid move card entity id");
    require(
      ShipComponent(LibUtils.addressById(world, ShipComponentID)).has(move.shipEntity),
      "MoveSystem: invalid ship entity id"
    );

    // calculate move card with  sail modifiers
    MoveCard memory moveCard = moveCardComponent.getValue(move.moveCardEntity);

    Coord memory position = positionComponent.getValue(move.shipEntity);
    uint32 rotation = rotationComponent.getValue(move.shipEntity);

    moveCard = getMoveWithSails(
      moveCard,
      SpeedComponent(LibUtils.addressById(world, SpeedComponentID)).getValue(move.shipEntity),
      sailPositionComponent.getValue(move.shipEntity)
    );

    position = LibVector.getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);

    rotation = (rotation + moveCard.rotation) % 360;

    if (LibVector.outOfBounds(world, gameId, position)) {
      LibCombat.damageHull(world, 1, move.shipEntity);
      sailPositionComponent.set(move.shipEntity, 0);
    } else {
      uint32 length = LengthComponent(LibUtils.addressById(world, LengthComponentID)).getValue(move.shipEntity);
      Coord memory sternPosition = LibVector.getSternPosition(position, rotation, length);
      if (LibVector.outOfBounds(world, gameId, sternPosition)) {
        LibCombat.damageHull(world, 1, move.shipEntity);
        sailPositionComponent.set(move.shipEntity, 0);
      }
    }
    positionComponent.set(move.shipEntity, position);
    rotationComponent.set(move.shipEntity, rotation);
  }
}
