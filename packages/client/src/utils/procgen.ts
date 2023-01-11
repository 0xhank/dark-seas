import color from "color";

const huesByHash = new Map<number | string, color>();

export function getColor(entity: number | string) {
  return color.rgb("#ffffff");
}

export function getColorNum(entity: number | string): number {
  return getColor(entity).rgbNumber();
}

export function getColorStr(entity: number | string): string {
  return getColor(entity).toString();
}
