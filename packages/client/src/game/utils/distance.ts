import { Coord } from "@latticexyz/utils";

export function distance(a: Coord, b: Coord): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function inRange(a: Coord, b: Coord, range: number): boolean {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= range ** 2;
}

export function coordToArray(coord: Coord) {
  return [coord.x, coord.y];
}
