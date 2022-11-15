import { Coord } from "@latticexyz/utils";

/**
 * @param a Coordinate A
 * @param b Coordinate B
 * @returns Manhattan distance from A to B (https://xlinux.nist.gov/dads/HTML/manhattanDistance.html)
 */
export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function distance(a: Coord, b: Coord): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function inRange(a: Coord, b: Coord, range: number): boolean {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= range ** 2;
}
