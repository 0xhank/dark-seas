import { Sprites } from "../types";

export function cap(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getHash(input: string) {
  let hash = 0,
    i,
    chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getShipColor(src: string) {
  const hash = getHash(src) % 5;
  return hash == 0 ? "Black" : hash == 1 ? "Red" : hash == 2 ? "Blue" : hash == 3 ? "Yellow" : "Green";
}

const prefix = "/img/ships";
export const ShipImages: Record<string, string> = {
  [Sprites.SailWhite]: "/img/ships/shipWhite.png",
  [Sprites.SailWhiteDead]: "/img/ships/shipWhiteDead.png",
  [Sprites.SailWhiteMajor]: "/img/ships/shipWhiteMajor.png",
  [Sprites.SailWhiteMinor]: "/img/ships/shipWhiteMinor.png",

  [Sprites.SailGreen]: "/img/ships/shipGreen.png",
  [Sprites.SailGreenDead]: "/img/ships/shipGreenDead.png",
  [Sprites.SailGreenMajor]: "/img/ships/sailGreenMajor.png",
  [Sprites.SailGreenMinor]: "/img/ships/shipGreenMinor.png",

  [Sprites.SailBlack]: "/img/ships/shipBlack.png",
  [Sprites.SailBlackDead]: "/img/ships/shipBlackDead.png",
  [Sprites.SailBlackMajor]: "/img/ships/shipBlackMajor.png",
  [Sprites.SailBlackMinor]: "/img/ships/shipBlackMinor.png",

  [Sprites.SailBlue]: "/img/ships/shipBlue.png",
  [Sprites.SailBlueDead]: "/img/ships/shipBlueDead.png",
  [Sprites.SailBlueMajor]: "/img/ships/shipBlueMajor.png",
  [Sprites.SailBlueMinor]: "/img/ships/shipBlueMinor.png",

  [Sprites.SailYellow]: "/img/ships/shipYellow.png",
  [Sprites.SailYellowDead]: "/img/ships/shipYellowDead.png",
  [Sprites.SailYellowMajor]: "/img/ships/shipYellowMajor.png",
  [Sprites.SailYellowMinor]: "/img/ships/shipYellowMinor.png",

  [Sprites.SailRed]: "/img/ships/shipRed.png",
  [Sprites.SailRedDead]: "/img/ships/shipRedDead.png",
  [Sprites.SailRedMajor]: "/img/ships/shipRedMajor.png",
  [Sprites.SailRedMinor]: "/img/ships/shipRedMinor.png",
};
