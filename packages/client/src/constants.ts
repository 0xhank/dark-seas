import { Coord } from "@latticexyz/utils";

export enum Direction {
  Top,
  Right,
  Bottom,
  Left,
}

export const Directions = {
  [Direction.Top]: { x: 0, y: -1 },
  [Direction.Right]: { x: 1, y: 0 },
  [Direction.Bottom]: { x: 0, y: 1 },
  [Direction.Left]: { x: -1, y: 0 },
};

export enum Side {
  Right,
  Left,
}

export type Line = {
  p1: Coord;
  p2: Coord;
};
