import { Coord } from "@latticexyz/utils";

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

export function getFiringArea(
  position: Coord,
  range: number,
  length: number,
  shipRotation: number,
  cannonRotation: number
): Coord[] {
  const topRange = (cannonRotation + 10) % 360;
  const bottomRange = (cannonRotation - 10) % 360;

  const sternPosition = getSternLocation(position, shipRotation, length);

  if (isBroadside(cannonRotation)) {
    let topCorner = getPositionByVector(position, shipRotation, range, topRange);
    let bottomCorner = getPositionByVector(sternPosition, shipRotation, range, bottomRange);

    if ((shipRotation + cannonRotation) % 360 >= 180) {
      topCorner = getPositionByVector(position, shipRotation, range, bottomRange);
      bottomCorner = getPositionByVector(sternPosition, shipRotation, range, topRange);
    }
    return [position, sternPosition, topCorner, bottomCorner];
  }

  const origin = cannonRotation > 180 ? sternPosition : position;

  return [
    origin,
    getPositionByVector(origin, shipRotation, range, bottomRange),
    getPositionByVector(origin, shipRotation, range, topRange),
  ];
}

export function midpoint(a: Coord, b: Coord): Coord {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function isBroadside(rotation: number) {
  return rotation == 90 || rotation == 270;
}
