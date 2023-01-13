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
  cannon_shot: {
    src: "/sounds/combat/Weapons_CannonsShot_04.wav",
    volume: FULL_VOLUME,
  },
  load_action: {
    src: "/sounds/combat/Weapons_Load.wav",
    volume: FULL_VOLUME,
  },
  fire_action: {
    src: "/sounds/combat/Weapons_Aim.wav",
    volume: FULL_VOLUME,
  },
};
