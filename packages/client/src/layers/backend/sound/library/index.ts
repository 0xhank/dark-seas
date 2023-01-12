import { environment } from "./environment";

export interface Sound {
  src: string;
  volume: number;
}

export enum Category {
  Environment,
}

export type SoundAsset = {
  [key: string]: Sound;
};

type soundLibrary = {
  [index in Category]: SoundAsset;
};

export const soundLibrary = {
  [Category.Environment]: environment,
};
