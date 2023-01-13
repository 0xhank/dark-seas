import { SoundAsset } from ".";

const QUIET_VOLUME = 0.3;
const FULL_VOLUME = 1;
export const ui: SoundAsset = {
  click: {
    src: "/sounds/ui/click.wav",
    volume: QUIET_VOLUME,
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
    volume: QUIET_VOLUME,
  },
  fail_notif: {
    src: "sounds/ui/fail-notif.wav",
    volume: QUIET_VOLUME,
  },
  tick: {
    src: "sounds/ui/tick.wav",
    volume: FULL_VOLUME,
  },
};
