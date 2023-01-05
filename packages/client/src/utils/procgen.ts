import { keccak256 } from "@latticexyz/utils";
import color from "color";

const huesByHash = new Map<number | string, color>();

export function getColor(entity: number | string) {
  if (huesByHash.has(entity)) {
    return huesByHash.get(entity) || color(0);
  }
  const hash = keccak256(entity.toString());
  const hue = parseInt(hash) % 360;

  const finalColor = color.hsl(hue, 100, 70);
  huesByHash.set(entity, finalColor);
  return finalColor; // remove 0x
}

export function getColorNum(entity: number | string): number {
  return getColor(entity).rgbNumber();
}

export function getColorStr(entity: number | string): string {
  return getColor(entity).toString();
}
