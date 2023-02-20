import { action } from "./action";
import { ambience } from "./ambience";
import { combat } from "./combat";
import { move } from "./move";
import { music } from "./music";
import { ui } from "./ui";

export interface Sound {
  src: string;
  volume: number;
}

export enum Category {
  Ambience,
  Action,
  Combat,
  Move,
  UI,
  Music,
}

export type SoundAsset = {
  [key: string]: Sound;
};

export const soundLibrary: { [index in Category]: SoundAsset } = {
  [Category.Ambience]: ambience,
  [Category.Action]: action,
  [Category.Move]: move,
  [Category.Combat]: combat,
  [Category.UI]: ui,
  [Category.Music]: music,
};
