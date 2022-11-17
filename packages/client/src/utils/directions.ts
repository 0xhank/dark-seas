import { Direction, Directions } from "../constants";
import { Coord, random } from "@latticexyz/utils";

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
export function translateDirection(coord: Coord, direction: Direction): Coord {
  return translate(coord, Directions[direction]);
}

/**
 * @returns Random direction (Top, Right, Bottom or Left)
 */
export function randomDirection(): Direction {
  return random(3, 0);
}

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

export function getMoveDistanceWithWind(
  windSpeed: number,
  windDirection: number,
  distance: number,
  rotation: number
): number {
  const moveDistance = getWindBoost(windSpeed, windDirection, rotation) + distance;
  return moveDistance > 0 ? moveDistance : 0;
}
