import { Coord } from "@latticexyz/utils";
import { MoveCard } from "../types";
import { getPositionByVector } from "./trig";

export function getMoveWithSails(moveCard: MoveCard, sailPosition: number): MoveCard {
  const buff = sailPosition == 2 ? 100 : sailPosition == 1 ? 33 : 0;
  return getMoveWithDebuff(moveCard, buff);
}

export function getFinalMoveCard(moveCard: MoveCard, rotation: number, sailPosition: number): MoveCard {
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
  sailPosition: number
): { finalPosition: Coord; finalRotation: number } {
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
