import { Coord } from "@latticexyz/utils";
import { MoveCard, Wind } from "../types";
import { getPositionByVector } from "./trig";

export function getWindBoost(wind: Wind, rotation: number): number {
  const rotationDiff: number = Math.abs(wind.direction - rotation);
  if (rotationDiff > 120 && rotationDiff <= 240) return -wind.speed;
  if (rotationDiff < 80 || rotationDiff > 280) return wind.speed;
  return 0;
}

export function getMoveWithWind(moveCard: MoveCard, rotation: number, wind: Wind): MoveCard {
  // if 0, +-0% if 10, +- 25% if 20 , +-50%
  const windBoost = (getWindBoost(wind, rotation) * 100) / 40;
  return getMoveWithDebuff(moveCard, windBoost + 100);
}

export function getMoveWithSails(moveCard: MoveCard, sailPosition: number): MoveCard {
  const buff = sailPosition == 2 ? 100 : sailPosition == 1 ? 33 : 0;
  return getMoveWithDebuff(moveCard, buff);
}

export function getFinalMoveCard(moveCard: MoveCard, rotation: number, sailPosition: number, wind: Wind): MoveCard {
  moveCard = getMoveWithWind(moveCard, rotation, wind);
  moveCard = getMoveWithSails(moveCard, sailPosition);
  return moveCard;
}

export function getMoveWithDebuff(moveCard: MoveCard, debuff: number): MoveCard {
  debuff = debuff / 100;
  if (debuff == 1) return moveCard;
  if (debuff == 0) return { distance: 0, rotation: 0, direction: 0 };

  moveCard.distance = moveCard.distance * debuff;
  if (debuff > 1) return moveCard;

  const modifiedDebuff = debuff * 1.75;
  if (moveCard.rotation > 180) {
    moveCard.rotation = 360 - moveCard.rotation * modifiedDebuff;
  } else {
    moveCard.rotation = 180 - moveCard.rotation * modifiedDebuff;
  }

  if (moveCard.direction > 180) {
    moveCard.direction = 360 - moveCard.rotation * modifiedDebuff;
  } else {
    moveCard.direction = 180 - moveCard.rotation * modifiedDebuff;
  }
  return moveCard;
}

export function getFinalPosition(
  moveCard: MoveCard,
  position: Coord,
  rotation: number,
  sailPosition: number,
  wind: Wind
): { finalPosition: Coord; finalRotation: number } {
  moveCard = getMoveWithWind(moveCard, rotation, wind);

  moveCard = getMoveWithSails(moveCard, sailPosition);

  const finalPosition = getPositionByVector(position, rotation, moveCard.distance, moveCard.direction);
  const finalRotation = rotation + (moveCard.rotation % 360);

  return { finalPosition, finalRotation };
}

export function rotationToDirectionName(rotation: number): string {
  rotation = rotation % 360;
  let ret = "";
  if (rotation > 215 && rotation < 315) ret += "N";
  if (rotation > 45 && rotation < 135) ret += "S";
  if ((rotation > 259 && rotation < 281) || (rotation > 79 && rotation < 101)) return ret;

  if (rotation > 248 && rotation < 292) return (ret += "NE");
  if (rotation > 68 && rotation < 112) return (ret += "SE");

  return ret;
}
