import { filterNullish } from "@latticexyz/utils";
import { filter, fromEvent, interval, map, merge, scan, Subscription, throttleTime } from "rxjs";
import { phaserConfig } from "../../../phaser/config";
import { POS_WIDTH } from "../../../phaser/constants";
import { SetupResult } from "../../../setupMUD";

export function registerCameraControls(MUD: SetupResult) {
  const {
    scene: { input, camera, phaserScene },

    utils: { getWorldDimsAtTime },
    network: { clock },
  } = MUD;

  const EDGE_SCROLL_SPEED = 8;
  const EDGE_PIXEL_SIZE = 60;

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

  const getCameraMovementFromPointerPosition = (event: MouseEvent) => {
    const cameraMovement = { x: 0, y: 0 };
    if (event.clientX < EDGE_PIXEL_SIZE) cameraMovement.x = -1;
    if (event.clientY < EDGE_PIXEL_SIZE) cameraMovement.y = -1;
    if (event.clientX > window.innerWidth - EDGE_PIXEL_SIZE) cameraMovement.x = 1;
    if (event.clientY > window.innerHeight - EDGE_PIXEL_SIZE) cameraMovement.y = 1;

    return new Phaser.Math.Vector2(cameraMovement).normalize();
  };

  const rawMouseMove$ = fromEvent<MouseEvent>(document, "mousemove");
  const screenEdgeCameraMovement$ = merge(interval(2), rawMouseMove$).pipe(
    filter(() => !!document.fullscreenElement),
    throttleTime(2),
    scan<number | MouseEvent, MouseEvent | undefined>((acc, event) => {
      if (typeof event == "number") return acc;

      return event;
    }, undefined),
    map((event) => {
      if (!event) return undefined;

      return getCameraMovementFromPointerPosition(event);
    }),
    filterNullish()
  );

  let screenEdgeCameraMoveSub: Subscription | undefined;
  rawMouseMove$.subscribe((event) => {
    const movement = getCameraMovementFromPointerPosition(event as MouseEvent);

    if (movement.length() > 0) {
      if (screenEdgeCameraMoveSub !== undefined) return;

      screenEdgeCameraMoveSub = screenEdgeCameraMovement$.subscribe((cameraMovement) => {
        camera.setScroll(
          camera.phaserCamera.scrollX + cameraMovement.x * EDGE_SCROLL_SPEED,
          camera.phaserCamera.scrollY + cameraMovement.y * EDGE_SCROLL_SPEED
        );
      });
    } else if (screenEdgeCameraMoveSub !== undefined) {
      screenEdgeCameraMoveSub?.unsubscribe();
      screenEdgeCameraMoveSub = undefined;
    }
  });
}
