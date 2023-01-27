import { PhaserEngineConfig, ScenesConfig } from "@latticexyz/phaserx/dist/types";
import { filterNullish } from "@latticexyz/utils";
import { filter, fromEvent, interval, map, merge, scan, Subscription, throttleTime } from "rxjs";
import { PhaserLayer } from "../types";

export function registerCameraControls<S extends ScenesConfig>(layer: PhaserLayer, config: PhaserEngineConfig<S>) {
  const {
    scene: { input, camera, phaserScene },
    api: {
      mapInteraction: { mapInteractionEnabled },
    },
  } = layer;

  const EDGE_SCROLL_SPEED = 8;
  const EDGE_PIXEL_SIZE = 60;

  input.pointermove$
    .pipe(
      filter(() => mapInteractionEnabled()),
      filter(({ pointer }) => pointer.isDown)
    )
    .subscribe(({ pointer }) => {
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
      if (deltaY >= 0 && newZoom < config.cameraConfig.minZoom) return;
      if (deltaY <= 0 && newZoom > config.cameraConfig.maxZoom) return;

      const mouseX = pointer.x;
      const mouseY = pointer.y;

      const viewWidth = camera.phaserCamera.width;
      const viewHeight = camera.phaserCamera.height;

      const pixelsDifferenceW = viewWidth / zoom - viewWidth / newZoom;
      const sideRatioX = (mouseX - viewWidth / 2) / viewWidth;
      const scrollX = camera.phaserCamera.x + pixelsDifferenceW * sideRatioX;

      const pixelsDifferenceY = viewHeight / zoom - viewHeight / newZoom;
      const sideRatioY = (mouseY - viewHeight / 2) / viewHeight;
      const scrollY = camera.phaserCamera.y + pixelsDifferenceY * sideRatioY;
      // camera.setScroll(scrollX, scrollY);
      camera.setZoom(newZoom);
    }
  );

  input.onKeyPress(
    (keys) => keys.has("F"),
    () => {
      const isFullscreen = !!document.fullscreenElement;
      const body = document.getElementsByTagName("body")[0];
      isFullscreen ? document.exitFullscreen() : body.requestFullscreen({ navigationUI: "hide" });
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
    filter(() => mapInteractionEnabled()),
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
  rawMouseMove$.pipe(filter(() => mapInteractionEnabled())).subscribe((event) => {
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
