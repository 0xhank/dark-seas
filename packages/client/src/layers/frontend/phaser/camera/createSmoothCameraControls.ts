import { PhaserEngineConfig, ScenesConfig } from "@latticexyz/phaserx/dist/types";
import { throttle } from "lodash";
import { PhaserLayer } from "../types";

export function createSmoothCameraControls<S extends ScenesConfig>(layer: PhaserLayer, config: PhaserEngineConfig<S>) {
  const {
    scenes: {
      Main: { phaserScene, camera },
    },
    api: {
      mapInteraction: { mapInteractionEnabled },
    },
  } = layer;

  if (!phaserScene.input.keyboard) return;

  const smoothCameraControlConfig: Phaser.Types.Cameras.Controls.SmoothedKeyControlConfig = {
    camera: camera.phaserCamera,
    left: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    right: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    up: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    down: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    zoomIn: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    zoomOut: phaserScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    acceleration: 0.3,
    drag: 0.005,
    maxSpeed: 1,
    maxZoom: config.cameraConfig.maxZoom,
    minZoom: config.cameraConfig.minZoom,
    zoomSpeed: 0.02,
  };
  const controls = new Phaser.Cameras.Controls.SmoothedKeyControl(smoothCameraControlConfig);
  const throttledCameraRefresh = throttle(() => {
    camera.setScroll(camera.phaserCamera.scrollX, camera.phaserCamera.scrollY);
    camera.setZoom(camera.phaserCamera.zoom);
  }, 750);

  let previousTime = Date.now();
  function tickCamera(time: number) {
    if (mapInteractionEnabled()) controls.update(time - previousTime);
    previousTime = time;

    throttledCameraRefresh();

    window.requestAnimationFrame(tickCamera);
  }
  requestAnimationFrame(tickCamera);
}
