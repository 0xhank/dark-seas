import { Howl } from "howler";
import { Category, soundLibrary } from "./library";

export function playSound(id: string, category: Category, loop = false, fade = false) {
  let timeout;

  const sound = new Howl({
    src: [soundLibrary[category][id].src],
    volume: soundLibrary[category][id].volume,
    preload: true,
    loop: loop,
  });
  if (fade) {
    // Fade on begin and end
    const FADE_TIME = 2000;

    // Init
    sound.play();
    sound.fade(0, 0.4, FADE_TIME);
    sound.on("load", function () {
      const FADE_OUT_TIME = sound.duration() * 1000 - sound.seek() - FADE_TIME;
      timeout = setTimeout(function () {
        sound.fade(0.4, 0, FADE_TIME);
      }, FADE_OUT_TIME);
    });
  } else {
    sound.play();
  }
  return sound;
}

export function startEnvironmentSoundSystem() {
  playSound("ocean", Category.Environment, true);
}
