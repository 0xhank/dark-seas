import { MoveCard, SailPositions, Wind } from "../constants";
import { Coord, random } from "@latticexyz/utils";
import { getPositionByVector } from "./trig";

/**
 * @param coord Initial coordinate
 * @param translation Relative translation of the initial coordinate
 * @returns New coordinate after translating
 */
export function translate(coord: Coord, translation: Coord): Coord {
  return { x: coord.x + translation.x, y: coord.y + translation.y };
}

/**
 * @param coord Initial coordinate
 * @param direction Direction to move to
 * @returns New coordiante after moving in the specified direction
 */

export function getSurroundingCoords(coord: Coord, distance = 1): Coord[] {
  const surroundingCoords: Coord[] = [];

  for (let x = -1 * distance; x <= distance; x++) {
    for (let y = -1 * distance; y <= distance; y++) {
      if (!(x === 0 && y === 0)) surroundingCoords.push(translate(coord, { x, y }));
    }
  }

  return surroundingCoords;
}

export function getWindBoost(windSpeed: number, windDirection: number, rotation: number): number {
  const rotationDiff: number = Math.abs(windDirection - rotation);
  if (rotationDiff < 21 || rotationDiff > 339 || (rotationDiff > 120 && rotationDiff <= 240)) return -windSpeed;
  if (rotationDiff < 80 || rotationDiff > 280) return windSpeed;
  return 0;
}

export function getMoveDistanceWithWind(wind: Wind, distance: number, rotation: number): number {
  const moveDistance = getWindBoost(wind.speed, wind.direction, rotation) + distance;
  return moveDistance > 0 ? moveDistance : 0;
}

export function getMoveWithSails(moveCard: MoveCard, sailPosition: number): MoveCard {
  if (sailPosition == 3) {
    return moveCard;
  }

  if (sailPosition == 2) {
    moveCard.distance = (moveCard.distance * 75) / 100;
    if (moveCard.rotation > 180) {
      moveCard.rotation = 360 - ((360 - moveCard.rotation) * 75) / 100;
    } else {
      moveCard.rotation = (moveCard.rotation * 75) / 100;
    }
    if (moveCard.direction > 180) {
      moveCard.direction = 360 - ((360 - moveCard.direction) * 75) / 100;
    } else {
      moveCard.direction = (moveCard.direction * 75) / 100;
    }
    return moveCard;
  }

  if (sailPosition == 1) {
    moveCard.distance = (moveCard.distance * 40) / 100;
    if (moveCard.rotation > 180) {
      moveCard.rotation = 360 - ((360 - moveCard.rotation) * 40) / 100;
    } else {
      moveCard.rotation = (moveCard.rotation * 40) / 100;
    }
    if (moveCard.direction > 180) {
      moveCard.direction = 360 - ((360 - moveCard.direction) * 40) / 100;
    } else {
      moveCard.direction = (moveCard.direction * 40) / 100;
    }
    return moveCard;
  }

  return { distance: 0, rotation: 0, direction: 0 };
}

export function getFinalMoveCard(moveCard: MoveCard, rotation: number, sailPosition: number, wind: Wind): MoveCard {
  moveCard = { ...moveCard, distance: getMoveDistanceWithWind(wind, moveCard.distance, rotation) };
  moveCard = getMoveWithSails(moveCard, sailPosition);
  return moveCard;
}

export function getFinalPosition(
  moveCard: MoveCard,
  position: Coord,
  rotation: number,
  sailPosition: number,
  wind: Wind
): { finalPosition: Coord; finalRotation: number } {
  moveCard = { ...moveCard, distance: getMoveDistanceWithWind(wind, moveCard.distance, rotation) };

  moveCard = getMoveWithSails(moveCard, sailPosition);

  const finalPosition = getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);
  const finalRotation = rotation + (moveCard.rotation % 360);

  return { finalPosition, finalRotation };
}

export function rotationToDirectionName(rotation: number): string {
  rotation = rotation % 360;
  let ret = "";
  if (rotation > 215 && rotation < 315) ret += "N";
  if (rotation > 45 && rotation < 135) ret += "S";
  if ((rotation > 259 && rotation < 281) || (rotation > 79 && rotation < 101)) return ret;

  if (rotation > 248 && rotation < 292) return (ret += "NE");
  if (rotation > 68 && rotation < 112) return (ret += "SE");

  return ret;
}
