export enum Arrows {
  Straight = "/img/arrows/straight.png",
  HardLeft = "/img/arrows/hard-left.png",
  HardRight = "/img/arrows/hard-right.png",
  Left = "/img/arrows/left.png",
  Right = "/img/arrows/right.png",
  SoftLeft = "/img/arrows/soft-left.png",
  SoftRight = "/img/arrows/soft-right.png",
  UTurn = "/img/arrows/u-turn.png",
  MediumRight = "/img/arrows/medium-right.png",
  MediumLeft = "/img/arrows/medium-left.png",
}

export enum ShipAttributeTypes {
  Sails,
}

export function arrowImg(rotation: number) {
  rotation = rotation % 360;
  if (rotation == 0) return Arrows.Straight;
  if (rotation > 330) return Arrows.SoftLeft;
  if (rotation > 290) return Arrows.MediumLeft;
  if (rotation > 250) return Arrows.Left;
  if (rotation > 200) return Arrows.HardLeft;
  if (rotation > 160) return Arrows.UTurn;
  if (rotation > 110) return Arrows.HardRight;
  if (rotation > 70) return Arrows.Right;
  if (rotation > 30) return Arrows.MediumRight;
  return Arrows.SoftRight;
}
