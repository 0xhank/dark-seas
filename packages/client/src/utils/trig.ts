import { Coord } from "@latticexyz/utils";
import { Line } from "../types";

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

function withinPolygon(point: Coord, polygon: Coord[]) {
  let wn = 0;
  for (let i = 0; i < polygon.length; i++) {
    const point1 = polygon[i];
    const point2 = i == polygon.length - 1 ? polygon[0] : polygon[i + 1];

    const isLeft = (point2.x - point1.x) * (point.y - point1.y) - (point.x - point1.x) * (point2.y - point1.y);
    if (isLeft == 0) return false;
    if (point1.y <= point.y && point2.y > point.y && isLeft > 0) wn++;
    else if (point1.y > point.y && point2.y <= point.y && isLeft < 0) wn--;
  }
  return wn != 0;
}
function lineIntersectsPolygon(line: Line, polygon: Coord[]) {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = i == polygon.length - 1 ? polygon[0] : polygon[i + 1];

    if (doLinesIntersect(line, { p1, p2 })) {
      return true;
    }
  }

  return false;
}
function doLinesIntersect(l1: Line, l2: Line): boolean {
  const x1 = l1.p1.x;
  const y1 = l1.p1.y;
  const x2 = l1.p2.x;
  const y2 = l1.p2.y;
  const x3 = l2.p1.x;
  const y3 = l2.p1.y;
  const x4 = l2.p2.x;
  const y4 = l2.p2.y;

  const d = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (d === 0) {
    return false;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

export function inFiringArea(line: Line, coords: Coord[]) {
  return withinPolygon(line.p1, coords) || lineIntersectsPolygon(line, coords);
}

export function midpoint(a: Coord, b: Coord): Coord {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function isBroadside(rotation: number) {
  return rotation == 90 || rotation == 270;
}
