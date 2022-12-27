import { Coord } from "@latticexyz/utils";
import { Side } from "../types";

export const deg2rad = (degrees: number) => degrees * (Math.PI / 180);

export function getPositionByVector(
  initialPosition: Coord,
  initialRotation: number,
  moveDistance: number,
  moveDirection: number
): Coord {
  const finalAngle = (initialRotation + moveDirection) % 360;
  const finalAngleRad = deg2rad(finalAngle);
  const x = Math.cos(finalAngleRad) * moveDistance + initialPosition.x;
  const y = Math.sin(finalAngleRad) * moveDistance + initialPosition.y;

  return { x: Math.round(x), y: Math.round(y) };
}

export function getSternLocation(origin: Coord, rotation: number, length: number): Coord {
  return getPositionByVector(origin, rotation, length, 180);
}

export function getFiringArea(position: Coord, range: number, length: number, rotation: number, side: Side): Coord[] {
  const topRange = side == Side.Right ? 80 : side == Side.Left ? 280 : 10;
  const bottomRange = side == Side.Right ? 100 : side == Side.Left ? 260 : 350;

  const sternLocation = getSternLocation(position, rotation, length);
  const topCorner = getPositionByVector(position, rotation, range, topRange);
  const bottomCorner = getPositionByVector(
    side == Side.Forward ? position : sternLocation,
    rotation,
    range,
    bottomRange
  );

  if (side == Side.Forward) return [position, bottomCorner, topCorner];

  return [position, sternLocation, bottomCorner, topCorner];
}

export function midpoint(a: Coord, b: Coord): Coord {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
