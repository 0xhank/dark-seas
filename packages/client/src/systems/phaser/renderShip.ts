import { colors } from "../../react/styles/global";

export function getRangeTintAlpha(loaded: boolean, selected: boolean, damaged: boolean) {
  if (damaged) return { tint: colors.blackHex, alpha: 0.2 };
  //UNSELECTED
  // Unloaded
  let fill = { tint: colors.whiteHex, alpha: 0.2 };

  // Loaded
  if (loaded) {
    fill = { tint: colors.goldHex, alpha: 0.4 };
  }
  //SELECTED
  if (selected) {
    //Unloaded
    fill = { tint: colors.goldHex, alpha: 0.7 };
    //Loaded
    if (loaded) fill = { tint: colors.cannonReadyHex, alpha: 0.7 };
  }
  return fill;
}
