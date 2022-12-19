import { filterNullish } from "@latticexyz/utils";
import { filter, fromEvent, interval, map, merge, scan, Subscription, throttleTime } from "rxjs";
import { PhaserLayer } from "../types";

export function registerCameraControls(layer: PhaserLayer) {
  const {
    scenes: {
      Main: { input, camera },
    },
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
