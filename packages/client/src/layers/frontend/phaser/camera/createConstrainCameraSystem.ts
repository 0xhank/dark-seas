import { defineComponentSystem, getComponentValue, setComponent } from "@latticexyz/recs";
import { PhaserLayer } from "../types";

export function createConstrainCameraSystem(layer: PhaserLayer) {
  const {
    world,
    components: { MapBounds, Position },
    godEntity,
    scene: { camera, posWidth, posHeight },
  } = layer;

  defineComponentSystem(world, Position, ({ value: [position] }) => {
    if (!position) return;
    const bounds = getComponentValue(MapBounds, godEntity);
    if (!bounds) return;

    const pixelX = position.x * posWidth;
    const pixelY = position.y * posHeight;

    const bufferPixels = 800;
    let boundsChanged = false;
    if (pixelX > bounds.right - bufferPixels) {
      boundsChanged = true;
      bounds.right = pixelX + bufferPixels;
    }
    if (pixelY > bounds.bottom - bufferPixels) {
      boundsChanged = true;
      bounds.bottom = pixelY + bufferPixels;
    }
    if (pixelX < bounds.left + bufferPixels) {
      boundsChanged = true;
      bounds.left = pixelX - bufferPixels;
    }
    if (pixelY < bounds.top + bufferPixels) {
      boundsChanged = true;
      bounds.top = pixelY - bufferPixels;
    }
    if (!boundsChanged) return;
    camera.phaserCamera.setBounds(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

    setComponent(MapBounds, godEntity, {
      top: bounds.top,
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
    });
  });
}