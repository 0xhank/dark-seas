export enum Arrows {
  Straight = "/img/arrows/straight.png",
  HardLeft = "/img/arrows/hard-left.png",
  HardRight = "/img/arrows/hard-right.png",
  Left = "/img/arrows/left.png",
  Right = "/img/arrows/right.png",
  SoftLeft = "/img/arrows/soft-left.png",
  SoftRight = "/img/arrows/soft-right.png",
  UTurn = "/img/arrows/uturn.png",
}

export enum ShipAttributeTypes {
  Firepower,
  Crew,
  Sails,
}

export function arrowImg(rotation: number) {
  return rotation == 360 || rotation == 0
    ? Arrows.Straight
    : rotation > 270
    ? Arrows.SoftLeft
    : rotation == 270
    ? Arrows.Left
    : rotation > 180
    ? Arrows.HardLeft
    : rotation == 180
    ? Arrows.UTurn
    : rotation > 90
    ? Arrows.HardRight
    : rotation == 90
    ? Arrows.Right
    : Arrows.SoftRight;
}
