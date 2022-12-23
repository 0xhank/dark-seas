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
  return getMoveWithBuff(moveCard, windBoost + 100);
}

export function getMoveWithSails(moveCard: MoveCard, sailPosition: number): MoveCard {
  const buff = sailPosition == 2 ? 100 : sailPosition == 1 ? 33 : 0;
  return getMoveWithBuff(moveCard, buff);
}

export function getFinalMoveCard(moveCard: MoveCard, rotation: number, sailPosition: number, wind: Wind): MoveCard {
  moveCard = getMoveWithWind(moveCard, rotation, wind);
  moveCard = getMoveWithSails(moveCard, sailPosition);
  return moveCard;
}

export function getMoveWithBuff(moveCard: MoveCard, buff: number): MoveCard {
  if (buff == 100) return moveCard;
  if (buff == 0) return { distance: 0, rotation: 0, direction: 0 };

  moveCard.distance = (moveCard.distance * buff) / 100;

  if (moveCard.rotation > 180) {
    moveCard.rotation = 360 - ((360 - moveCard.rotation) * buff) / 100;
  } else {
    moveCard.rotation = (moveCard.rotation * buff) / 100;
  }

  if (moveCard.direction > 180) {
    moveCard.direction = 360 - ((360 - moveCard.direction) * buff) / 100;
  } else {
    moveCard.direction = (moveCard.direction * buff) / 100;
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
