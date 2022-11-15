import { Coord } from "@latticexyz/utils";
import { Line, Side } from "../constants";

export function getPositionByVector(
  initialPosition: Coord,
  initialRotation: number,
  moveDistance: number,
  moveAngle: number
): Coord {
  const finalAngle = (initialRotation + moveAngle) % 360;
  const finalAngleRad = deg2rad(finalAngle);
  const x = Math.cos(finalAngleRad) * moveDistance + initialPosition.x;
  const y = Math.sin(finalAngleRad) * moveDistance + initialPosition.y;

  return { x: Math.round(x), y: Math.round(y) };
}

export const deg2rad = (degrees: number) => degrees * (Math.PI / 180);

export function getSternLocation(origin: Coord, rotation: number, length: number): Coord {
  return getPositionByVector(origin, rotation, length, 180);
}

export function direction(a: Coord, b: Coord, c: Coord): number {
  const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (val == 0) return 0;
  if (val < 0) return 2;
  return 1;
}

export function onLine(l1: Line, p: Coord): boolean {
  return (
    p.x <= Math.max(l1.p1.x, l1.p2.x) &&
    p.x <= Math.max(l1.p1.x, l1.p2.x) &&
    p.y <= Math.max(l1.p1.y, l1.p2.y) &&
    p.y <= Math.min(l1.p1.y, l1.p2.y)
  );
}

export function isIntersect(l1: Line, l2: Line): boolean {
  const dir1 = direction(l1.p1, l1.p2, l2.p1);
  const dir2 = direction(l1.p1, l1.p2, l2.p2);
  const dir3 = direction(l2.p1, l2.p2, l1.p1);
  const dir4 = direction(l2.p1, l2.p2, l1.p2);

  if (dir1 != dir2 && dir3 != dir4) return true;
  if (dir1 == 0 && onLine(l1, l2.p1)) return true;
  if (dir2 == 0 && onLine(l1, l2.p2)) return true;
  if (dir3 == 0 && onLine(l2, l1.p1)) return true;
  if (dir4 == 0 && onLine(l2, l1.p2)) return true;
  return false;
}

export function checkInside(coords: Coord[], p: Coord): boolean {
  const exline: Line = { p1: p, p2: { x: Number.MIN_SAFE_INTEGER, y: p.y } };

  let count = 0,
    i = 0;
  do {
    const iPlusOne = (i + 1) % 4;
    const side: Line = { p1: coords[i], p2: coords[iPlusOne] };
    if (isIntersect(side, exline)) {
      if (direction(side.p1, p, side.p2) == 0) return onLine(side, p);
      count++;
    }
    i = iPlusOne;
  } while (i != 0);
  return count % 2 == 1;
}

export function getFiringArea(position: Coord, range: number, length: number, rotation: number, side: Side): Coord[] {
  const topRange = side == Side.Left ? 80 : 280;
  const bottomRange = side == Side.Left ? 100 : 260;

  const sternLocation = getSternLocation(position, rotation, length);
  const topCorner = getPositionByVector(position, rotation, range, topRange);
  const bottomCorner = getPositionByVector(sternLocation, rotation, range, bottomRange);

  return [position, sternLocation, topCorner, bottomCorner];
}
