import { SoundAsset } from ".";

const BASE_VOLUME = 0.5;
const FULL_VOLUME = 1;
export const combat: SoundAsset = {
  impact_water_1: {
    src: "/sounds/combat/Impact_Cannon_OnWater_01.wav",
    volume: BASE_VOLUME,
  },
  impact_water_2: {
    src: "/sounds/combat/Impact_Cannon_OnWater_03.wav",
    volume: BASE_VOLUME,
  },
  impact_ship_1: {
    src: "/sounds/combat/Impact_Ship_01.wav",
    volume: 0.3,
  },
  impact_ship_2: {
    src: "/sounds/combat/Impact_Ship_02.wav",
    volume: 0.3,
  },
  cannon_shot: {
    src: "/sounds/combat/Weapons_CannonsShot_04.wav",
    volume: BASE_VOLUME,
  },
  load_action: {
    src: "/sounds/combat/Weapons_Load.wav",
    volume: BASE_VOLUME,
  },
  fire_action: {
    src: "/sounds/combat/Weapons_Aim.wav",
    volume: BASE_VOLUME,
  },
};
