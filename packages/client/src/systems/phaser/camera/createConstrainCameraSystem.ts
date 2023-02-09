import { defineComponentSystem, getComponentValue, setComponent } from "@latticexyz/recs";
import { POS_HEIGHT, POS_WIDTH } from "../../../layers/frontend/phaser/constants";
import { useMUD } from "../../../MUDContext";

export function createConstrainCameraSystem() {
  const {
    world,
    components: { MapBounds, Position },
    godEntity,
    scene: { camera },
  } = useMUD();

  defineComponentSystem(world, Position, ({ value: [position] }) => {
    if (!position) return;
    const bounds = getComponentValue(MapBounds, godEntity);
    if (!bounds) return;

    const pixelX = position.x * POS_WIDTH;
    const pixelY = position.y * POS_HEIGHT;

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
