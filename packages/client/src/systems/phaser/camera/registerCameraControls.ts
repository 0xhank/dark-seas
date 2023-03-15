import { filter } from "rxjs";
import { phaserConfig } from "../../../phaser/config";
import { POS_WIDTH } from "../../../phaser/constants";
import { SetupResult } from "../../../setupMUD";

export function cameraControlSystems(MUD: SetupResult) {
  const {
    scene: { input, camera, phaserScene },

    utils: { getWorldDimsAtTime },
    network: { clock },
  } = MUD;

  input.pointermove$.pipe(filter(({ pointer }) => pointer.isDown)).subscribe(({ pointer }) => {
    camera.setScroll(
      camera.phaserCamera.scrollX - (pointer.x - pointer.prevPosition.x) / camera.phaserCamera.zoom,
      camera.phaserCamera.scrollY - (pointer.y - pointer.prevPosition.y) / camera.phaserCamera.zoom
    );
  });

  phaserScene.input.on(
    "wheel",
    (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: any, deltaY: number, deltaZ: any) => {
      const zoom = camera.phaserCamera.zoom;
      const zoomScale = deltaY < 0 ? 1.08 : 0.92;
      const newZoom = zoom * zoomScale; // deltaY>0 means we scrolled down

      const useHeight = camera.phaserCamera.displayWidth / camera.phaserCamera.displayHeight < 16 / 9;
      const currDisplayDim = useHeight ? camera.phaserCamera.displayHeight : camera.phaserCamera.displayWidth;
      const newDisplayDim = currDisplayDim * (deltaY < 0 ? 0.92 : 1.08);
      const worldDims = getWorldDimsAtTime(clock.currentTime);

      const mapView = useHeight ? worldDims.height : worldDims.width * POS_WIDTH * 2;
      const maxDim = Math.max(mapView, 6000);
      if (deltaY >= 0 && (newZoom < phaserConfig.cameraConfig.minZoom || maxDim <= newDisplayDim)) return;
      if (deltaY <= 0 && newZoom > phaserConfig.cameraConfig.maxZoom) return;

      camera.setZoom(newZoom);
    }
  );
}
