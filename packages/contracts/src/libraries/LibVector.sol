// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { Perlin } from "noise/Perlin.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Coord, Line, GodID, GameConfig } from "../libraries/DSTypes.sol";

// Libraries
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import "./LibTurn.sol";
import "trig/src/Trigonometry.sol";

library LibVector {
  /**
   * @notice  calculates a final coord based on a move vector
   * @param   initialPosition  starting coordinate
   * @param   initialRotation  starting rotation
   * @param   _distance  distance to move
   * @param   direction  direction to move
   * @return  Coord  final position
   */
  function getPositionByVector(
    Coord memory initialPosition,
    uint32 initialRotation,
    uint32 _distance,
    uint32 direction
  ) internal pure returns (Coord memory) {
    uint32 angleDegs = (initialRotation + direction) % 360;

    uint256 angleRadsTimes10000 = uint256(angleDegs * 1745);

    uint256 angleRadsConverted = angleRadsTimes10000 * 1e13 + Trigonometry.TWO_PI;

    int256 newX = Trigonometry.cos(angleRadsConverted) * int32(_distance);

    int256 newY = Trigonometry.sin(angleRadsConverted) * int32(_distance);

    int32 finalX = int32(newX / 1e18) + initialPosition.x;
    int32 finalY = int32(newY / 1e18) + initialPosition.y;

    return Coord({ x: finalX, y: finalY });
  }

  /**
   * @notice  retrieves positions of both bow (front) and stern (back) of ship
   * @dev     bow is always the position and stern is calculated using getPositionByVector based on ship's rotation and length
   * @param   world world and components
   * @param   shipEntity  ship's entity id
   * @return  Coord  ship bow
   * @return  Coord  ship stern
   */
  function getShipBowAndSternPosition(IWorld world, uint256 shipEntity)
    public
    view
    returns (Coord memory, Coord memory)
  {
    ShipComponent shipComponent = ShipComponent(LibUtils.addressById(world, ShipComponentID));
    require(shipComponent.has(shipEntity), "LibVector: not a ship");

    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    LengthComponent lengthComponent = LengthComponent(LibUtils.addressById(world, LengthComponentID));
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));

    uint32 length = lengthComponent.getValue(shipEntity);
    uint32 rotation = rotationComponent.getValue(shipEntity);

    Coord memory shipPosition = positionComponent.getValue(shipEntity);
    Coord memory sternPosition = getSternPosition(shipPosition, rotation, length);

    return (shipPosition, sternPosition);
  }

  /**
   * @notice  calculates stern position based on length and bow position
   * @param   originPosition  bow position
   * @param   rotation  ship rotation
   * @param   length  ship length
   * @return  Coord  stern position
   */
  function getSternPosition(
    Coord memory originPosition,
    uint32 rotation,
    uint32 length
  ) internal pure returns (Coord memory) {
    return getPositionByVector(originPosition, rotation, length, 180);
  }

  function withinPolygon(Coord memory point, Coord[] memory coords) public pure returns (bool) {
    int32 wn = 0;
    for (uint32 i = 0; i < coords.length; i++) {
      Coord memory point1 = coords[i];
      Coord memory point2 = i == coords.length - 1 ? coords[0] : coords[i + 1];

      int32 isLeft = ((point2.x - point1.x) * (point.y - point1.y)) - ((point.x - point1.x) * (point2.y - point1.y));
      if (isLeft == 0) return false;
      if (point1.y <= point.y && point2.y > point.y && isLeft > 0) wn++;
      else if (point1.y > point.y && point2.y <= point.y && isLeft < 0) wn--;
    }
    return wn != 0;
  }

  function lineIntersectsPolygon(Line memory line, Coord[] memory polygon) public pure returns (bool) {
    for (uint32 i = 0; i < polygon.length; i++) {
      Coord memory point1 = polygon[i];
      Coord memory point2 = i == polygon.length - 1 ? polygon[0] : polygon[i + 1];

      if (linesIntersect(line, Line({ start: point1, end: point2 }))) {
        return true;
      }
    }

    return false;
  }

  function max(int32 a, int32 b) private pure returns (int32) {
    return a > b ? a : b;
  }

  function min(int32 a, int32 b) private pure returns (int32) {
    return a < b ? a : b;
  }

  function linesIntersect(Line memory l1, Line memory l2) public pure returns (bool) {
    int256 x1 = l1.start.x;
    int256 y1 = l1.start.y;
    int256 x2 = l1.end.x;
    int256 y2 = l1.end.y;
    int256 x3 = l2.start.x;
    int256 y3 = l2.start.y;
    int256 x4 = l2.end.x;
    int256 y4 = l2.end.y;

    // lets say parallel lines do not intersect
    int256 denom = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (denom == 0) return false;
    int256 ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    int256 ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= int256(1) && ub >= 0 && ub <= int256(1);
  }

  /**
   * @notice  calculates distance between two points
   * @param   a  origin
   * @param   b  destination
   * @return  uint256  distance
   */
  function distance(Coord memory a, Coord memory b) public pure returns (uint256) {
    int128 distanceSquared = (a.x - b.x)**2 + (a.y - b.y)**2;
    return Math.toUInt(Math.sqrt(Math.fromInt(distanceSquared)));
  }

  /**
   * @notice  checks if a position is within the radius of the world
   * @param   world world and components
   * @param   position  position to check if within radius
   * @return  bool  is within radius?
   */
  function inWorld(IWorld world, Coord memory position) public view returns (bool) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );

    uint32 worldHeight = getWorldHeightAtTurn(gameConfig, LibTurn.getCurrentTurn(world));
    int32 x = position.x;
    int32 y = position.y;
    uint32 worldWidth = (worldHeight * 16) / 9;
    if (x < 0) x = 0 - x;
    if (y < 0) y = 0 - y;

    return uint32(x) < worldWidth && uint32(y) < worldHeight;
  }

  function getWorldHeightAtTurn(GameConfig memory gameConfig, uint32 turn) internal pure returns (uint32) {
    if (turn <= gameConfig.entryCutoffTurns || gameConfig.shrinkRate == 0) return gameConfig.worldSize;
    uint32 turnsAfterCutoff = turn - gameConfig.entryCutoffTurns;
    int64 finalSize = int32(gameConfig.worldSize) -
      Math.toInt(Math.mul(Math.divu(gameConfig.shrinkRate, 100), Math.fromUInt(turnsAfterCutoff)));
    return finalSize < 50 ? 50 : uint32(int32(finalSize));
  }

  /**
   * @notice  checks if the given position is out of bounds
   * @param   world world and components
   * @param   position  position to check if out of bounds
   * @return  bool  is out of bounds
   */
  function outOfBounds(IWorld world, Coord memory position) internal view returns (bool) {
    if (!inWorld(world, position)) return true;

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    int128 denom = 50;
    int128 depth = Perlin.noise2d(position.x + gameConfig.perlinSeed, position.y + gameConfig.perlinSeed, denom, 64);

    depth = int128(Math.muli(depth, 100));

    return depth < int8(gameConfig.islandThreshold);
  }
}
