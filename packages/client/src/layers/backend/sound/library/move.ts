import { SoundAsset } from ".";

const BASE_VOLUME = 0.3;
const FULL_VOLUME = 1;
export const move: SoundAsset = {
  rudder_1: {
    src: "/sounds/move/Item_Rudder_Movement_01.wav",
    volume: BASE_VOLUME,
  },
  whoosh: {
    src: "/sounds/move/whoosh.wav",
    volume: FULL_VOLUME,
  },
};
