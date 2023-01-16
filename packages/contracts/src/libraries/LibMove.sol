// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { Perlin } from "noise/Perlin.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../components/SpeedComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { MoveCard, Move, Coord, GodID, GameConfig } from "./DSTypes.sol";

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
    moveCard.distance = (moveCard.distance * shipSpeed) / 100;
    if (sailPosition == 2) {
      return getMoveWithBuff(moveCard, 100);
    }

    if (sailPosition == 1) {
      return getMoveWithBuff(moveCard, 60);
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


   */
  /**
   * @notice  moves a ship
   * @param   components  world components
   * @param   move  move to execute
   * @param   playerEntity  owner of ship
   */
  function moveShip(
    IUint256Component components,
    Move memory move,
    uint256 playerEntity
  ) public {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    require(
      HealthComponent(getAddressById(components, HealthComponentID)).getValue(move.shipEntity) > 0,
      "MoveSystem: ship is sunk"
    );

    require(
      OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(move.shipEntity) == playerEntity,
      "MoveSystem: you don't own this ship"
    );
    require(moveCardComponent.has(move.moveCardEntity), "MoveSystem: invalid move card entity id");
    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(move.shipEntity),
      "MoveSystem: invalid ship entity id"
    );

    // calculate move card with  sail modifiers
    MoveCard memory moveCard = moveCardComponent.getValue(move.moveCardEntity);

    Coord memory position = positionComponent.getValue(move.shipEntity);
    uint32 rotation = rotationComponent.getValue(move.shipEntity);

    moveCard = getMoveWithSails(
      moveCard,
      SpeedComponent(getAddressById(components, SpeedComponentID)).getValue(move.shipEntity),
      SailPositionComponent(getAddressById(components, SailPositionComponentID)).getValue(move.shipEntity)
    );

    position = LibVector.getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);

    rotation = (rotation + moveCard.rotation) % 360;

    if (outOfBounds(components, position)) {
      LibCombat.damageHull(components, 1, move.shipEntity);
    }

    positionComponent.set(move.shipEntity, position);
    rotationComponent.set(move.shipEntity, rotation);
  }

  function outOfBounds(IUint256Component components, Coord memory position) private returns (bool) {
    if (!LibVector.inWorld(components, position)) return true;

    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    int128 denom = 50;
    int128 depth = Perlin.noise2d(position.x + gameConfig.perlinSeed, position.y + gameConfig.perlinSeed, denom, 64);

    depth = int128(Math.muli(depth, 100));

    return depth < 26;
  }
}
