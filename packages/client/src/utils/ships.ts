import { EntityIndex } from "@latticexyz/recs";
import { Sprites } from "../constants";

export function getShipSprite(playerEntity: EntityIndex, ownerEntity: EntityIndex, health: number): Sprites {
  // return config.sprites[Sprites.ShipWhite];
  if (playerEntity == ownerEntity) {
    if (health > 7) return Sprites.ShipWhite;
    else if (health > 4) return Sprites.ShipWhiteMinor;
    else if (health > 0) return Sprites.ShipWhiteMajor;
    else return Sprites.ShipWhiteDead;
  }

  const color = getShipColor(playerEntity);

  if (color == ShipColors.Red) {
    if (health > 7) return Sprites.ShipRed;
    else if (health > 4) return Sprites.ShipRedMinor;
    else if (health > 0) return Sprites.ShipRedMajor;
    else return Sprites.ShipRedDead;
  } else if (color == ShipColors.Yellow) {
    if (health > 7) return Sprites.ShipYellow;
    else if (health > 4) return Sprites.ShipYellowMinor;
    else if (health > 0) return Sprites.ShipYellowMajor;
    else return Sprites.ShipYellowDead;
  } else if (color == ShipColors.Black) {
    if (health > 7) return Sprites.ShipBlack;
    else if (health > 4) return Sprites.ShipBlackMinor;
    else if (health > 0) return Sprites.ShipBlackMajor;
    else return Sprites.ShipBlackDead;
  } else if (color == ShipColors.Blue) {
    if (health > 7) return Sprites.ShipBlue;
    else if (health > 4) return Sprites.ShipBlueMinor;
    else if (health > 0) return Sprites.ShipBlueMajor;
    else return Sprites.ShipBlueDead;
  } else if (color == ShipColors.Green) {
    if (health > 7) return Sprites.ShipGreen;
    else if (health > 4) return Sprites.ShipGreenMinor;
    else if (health > 0) return Sprites.ShipGreenMajor;
    else return Sprites.ShipGreenDead;
  }

  return Sprites.ShipBlack;
}

export function getShipColor(src: number): ShipColors {
  return src % 5;
}

export enum ShipColors {
  Black,
  Red,
  Blue,
  Yellow,
  Green,
}

export const ShipImages: Record<number, string> = {
  [Sprites.ShipWhite]: "/img/ships/shipWhite.png",
  [Sprites.ShipWhiteDead]: "/img/ships/shipWhiteDead.png",
  [Sprites.ShipWhiteMajor]: "/img/ships/shipWhiteMajor.png",
  [Sprites.ShipWhiteMinor]: "/img/ships/shipWhiteMinor.png",

  [Sprites.ShipGreen]: "/img/ships/shipGreen.png",
  [Sprites.ShipGreenDead]: "/img/ships/shipGreenDead.png",
  [Sprites.ShipGreenMajor]: "/img/ships/shipGreenMajor.png",
  [Sprites.ShipGreenMinor]: "/img/ships/shipGreenMinor.png",

  [Sprites.ShipBlack]: "/img/ships/shipBlack.png",
  [Sprites.ShipBlackDead]: "/img/ships/shipBlackDead.png",
  [Sprites.ShipBlackMajor]: "/img/ships/shipBlackMajor.png",
  [Sprites.ShipBlackMinor]: "/img/ships/shipBlackMinor.png",

  [Sprites.ShipBlue]: "/img/ships/shipBlue.png",
  [Sprites.ShipBlueDead]: "/img/ships/shipBlueDead.png",
  [Sprites.ShipBlueMajor]: "/img/ships/shipBlueMajor.png",
  [Sprites.ShipBlueMinor]: "/img/ships/shipBlueMinor.png",

  [Sprites.ShipYellow]: "/img/ships/shipYellow.png",
  [Sprites.ShipYellowDead]: "/img/ships/shipYellowDead.png",
  [Sprites.ShipYellowMajor]: "/img/ships/shipYellowMajor.png",
  [Sprites.ShipYellowMinor]: "/img/ships/shipYellowMinor.png",

  [Sprites.ShipRed]: "/img/ships/shipRed.png",
  [Sprites.ShipRedDead]: "/img/ships/shipRedDead.png",
  [Sprites.ShipRedMajor]: "/img/ships/shipRedMajor.png",
  [Sprites.ShipRedMinor]: "/img/ships/shipRedMinor.png",
};
