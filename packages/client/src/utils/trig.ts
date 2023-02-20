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

export function getPolygonArea(coords: Coord[]) {
  let area = 0,
    i,
    j,
    point1,
    point2;

  for (i = 0, j = coords.length - 1; i < coords.length; j = i, i++) {
    point1 = coords[i];
    point2 = coords[j];
    area += point1.x * point2.y;
    area -= point1.y * point2.x;
  }
  area /= 2;

  return area;
}
export function getPolygonCenter(coords: Coord[]) {
  let x = 0,
    y = 0,
    i,
    j;

  for (i = 0, j = coords.length - 1; i < coords.length; j = i, i++) {
    const point1 = coords[i];
    const point2 = coords[j];
    const f = point1.x * point2.y - point2.x * point1.y;
    x += (point1.x + point2.x) * f;
    y += (point1.y + point2.y) * f;
  }

  const a = getPolygonArea(coords) * 6;

  return { x: x / a, y: y / a };
}

(window as any).polygon = getPolygonCenter;

export function getMidpoint(origin: Coord, rotation: number, length: number): Coord {
  return getPositionByVector(origin, rotation, length / 2, 180);
}

export function getSternPosition(origin: Coord, rotation: number, length: number): Coord {
  return getPositionByVector(origin, rotation, length, 180);
}

export function getFiringArea(
  position: Coord,
  range: number,
  length: number,
  shipRotation: number,
  cannonRotation: number
): Coord[] {
  const rightRange = (cannonRotation + 10) % 360;
  const leftRange = (cannonRotation - 10) % 360;

  const sternPosition = getSternPosition(position, shipRotation, length);

  if (isBroadside(cannonRotation)) {
    let frontCorner = getPositionByVector(position, shipRotation, range, rightRange);
    let backCorner = getPositionByVector(sternPosition, shipRotation, range, leftRange);

    if (cannonRotation < 180) {
      frontCorner = getPositionByVector(position, shipRotation, range, leftRange);
      backCorner = getPositionByVector(sternPosition, shipRotation, range, rightRange);
    }
    return [position, sternPosition, backCorner, frontCorner];
  }

  const origin = cannonRotation >= 90 && cannonRotation < 270 ? sternPosition : position;

  return [
    origin,
    getPositionByVector(origin, shipRotation, range, leftRange),
    getPositionByVector(origin, shipRotation, range, rightRange),
  ];
}

export function inFiringArea(coords: Coord[], point: Coord) {
  let wn = 0;
  for (let i = 0; i < coords.length; i++) {
    const point1 = coords[i];
    const point2 = i == coords.length - 1 ? coords[0] : coords[i + 1];

    const isLeft = (point2.x - point1.x) * (point.y - point1.y) - (point.x - point1.x) * (point2.y - point1.y);
    if (isLeft == 0) return false;
    if (point1.y <= point.y && point2.y > point.y && isLeft > 0) wn++;
    else if (point1.y > point.y && point2.y <= point.y && isLeft < 0) wn--;
  }
  return wn != 0;
}

export function midpoint(a: Coord, b: Coord): Coord {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function isBroadside(rotation: number) {
  return rotation == 90 || rotation == 270;
}
