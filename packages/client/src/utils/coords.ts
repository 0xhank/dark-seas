import { Coord } from "@latticexyz/utils";

export function coordEq(a?: Coord, b?: Coord): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

export function coordToArray(coord: Coord): number[] {
  return [coord.x, coord.y];
}
