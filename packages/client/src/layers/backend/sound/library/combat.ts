import { SoundAsset } from ".";

const BASE_VOLUME = 0.3;
const FULL_VOLUME = 1;
export const combat: SoundAsset = {
  impact_water_1: {
    src: "/sounds/combat/Impact_Cannon_OnWater_01.wav",
    volume: BASE_VOLUME,
  },
  impact_water_2: {
    src: "/sounds/combat/Impact_Cannon_OnWater_03.wav",
    volume: FULL_VOLUME,
  },
  impact_ship_1: {
    src: "/sounds/combat/Impact_Ship_01.wav",
    volume: BASE_VOLUME,
  },
  impact_ship_2: {
    src: "/sounds/combat/Impact_Ship_02.wav",
    volume: FULL_VOLUME,
  },
  CannonsShot_1: {
    src: "/sounds/combat/Weapons_CannonsShot_01.wav",
    volume: BASE_VOLUME,
  },
  CannonsShot_2: {
    src: "/sounds/combat/Weapons_CannonsShot_02.wav",
    volume: FULL_VOLUME,
  },
  CannonsShot_3: {
    src: "/sounds/combat/Weapons_CannonsShot_03.wav",
    volume: FULL_VOLUME,
  },
};
