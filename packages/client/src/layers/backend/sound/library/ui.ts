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
    volume: 0.5,
  },
  success_notif: {
    src: "/sounds/ui/success.wav",
    volume: 0.5,
  },
  button_hover: {
    src: "/sounds/ui/button-hover.mp3",
    volume: 0.5,
  },
  success: {
    src: "/sounds/ui/success-notif.wav",
    volume: 0.1,
  },
  fail_notif: {
    src: "sounds/ui/fail-notif.wav",
    volume: 0.1,
  },
  tick: {
    src: "sounds/ui/tick.wav",
    volume: 0.7,
  },
  reset: {
    src: "sounds/ui/reset.wav",
    volume: FULL_VOLUME,
  },
};
