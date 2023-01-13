import { SoundAsset } from ".";

const BASE_VOLUME = 0.3;
const FULL_VOLUME = 1;
export const ui: SoundAsset = {
  click: {
    src: "/sounds/ui/click.wav",
    volume: FULL_VOLUME,
  },
  hover: {
    src: "/sounds/ui/button-hover.mp3",
    volume: FULL_VOLUME,
  },
  success: {
    src: "/sounds/ui/success.mp3",
    volume: FULL_VOLUME,
  },
  button_hover: {
    src: "/sounds/ui/button-hover.mp3",
    volume: FULL_VOLUME,
  },
  success_notif: {
    src: "/sounds/ui/success-notif.wav",
    volume: FULL_VOLUME,
  },
  fail_notif: {
    src: "sounds/ui/fail-notif.wav",
    volume: FULL_VOLUME,
  },
};
