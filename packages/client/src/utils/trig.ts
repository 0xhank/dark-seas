import { Coord } from "@latticexyz/utils";
import { Line, Side } from "../constants";

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
  const topRange = side == Side.Right ? 80 : 280;
  const bottomRange = side == Side.Right ? 100 : 260;

  const sternLocation = getSternLocation(position, rotation, length);
  const topCorner = getPositionByVector(position, rotation, range, topRange);
  const bottomCorner = getPositionByVector(sternLocation, rotation, range, bottomRange);

  return [position, sternLocation, bottomCorner, topCorner];
}
