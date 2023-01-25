import { Coord } from "@latticexyz/utils";
import { MoveCard } from "../types";
import { getPositionByVector } from "./trig";

export function getMoveWithSails(moveCard: MoveCard, speed: number, sailPosition: number): MoveCard {
  moveCard.distance = (moveCard.distance * speed) / 100;
  const buff = sailPosition == 2 ? 100 : sailPosition == 1 ? 70 : 0;
  return getMoveWithDebuff(moveCard, buff);
}

export function getMoveWithDebuff(moveCard: MoveCard, buff: number): MoveCard {
  if (buff == 100) return moveCard;
  if (buff == 0) return { distance: 0, rotation: 0, direction: 0 };

  moveCard.distance = (moveCard.distance * buff) / 100;

  if (moveCard.rotation > 180) {
    moveCard.rotation = 360 - ((360 - moveCard.rotation) * 100) / buff;
  } else {
    moveCard.rotation = (moveCard.rotation * 100) / buff;
  }

  if (moveCard.direction > 180) {
    moveCard.direction = 360 - ((360 - moveCard.direction) * 100) / buff;
  } else {
    moveCard.direction = (moveCard.direction * 100) / buff;
  }
  return moveCard;
}

export function getFinalPosition(
  moveCard: MoveCard,
  position: Coord,
  rotation: number,
  speed: number,
  sailPosition: number
): { finalPosition: Coord; finalRotation: number } {
  moveCard = getMoveWithSails(moveCard, speed, sailPosition);

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
