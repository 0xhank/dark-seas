import { Key, pixelCoordToTileCoord } from "@latticexyz/phaserx";
import {
  defineEnterSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { PhaserLayer } from "../types";

export function createInputSystem(phaser: PhaserLayer) {
  const {
    world,
    components: { SelectedShip, Position, OwnedBy },
    utils: { getPlayerEntity },
    godIndex,
    scene: {
      input,
      camera,
      posWidth,
      posHeight,
      maps: {
        Main: { tileWidth, tileHeight },
      },
    },
  } = phaser;

  const shipKeyRegistry = new Map<Key, EntityIndex>();
  const NumberKeyNames: Key[] = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];

  defineEnterSystem(world, [Has(Position), Has(OwnedBy)], ({ entity }) => {
    const owner = getComponentValueStrict(OwnedBy, entity).value;
    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;
    if (owner != world.entities[playerEntity]) return;

    console.log("setting shortcut for", entity);
    for (let i = 0; i < 5; i++) {
      const ship = shipKeyRegistry.has(NumberKeyNames[i]);
      if (!ship) return shipKeyRegistry.set(NumberKeyNames[i], entity);
    }
  });

  const clickSub = input.click$.subscribe((p) => {
    const pointer = p as Phaser.Input.Pointer;
    const tilePos = pixelCoordToTileCoord({ x: pointer.worldX, y: pointer.worldY }, tileWidth, tileHeight);

    // console.log("tile position:", tilePos);
    // console.log("pixel position:", pointer.worldX, pointer.worldY);
  });

  input.onKeyPress(
    (keys) => keys.has("ESC"),
    () => {
      removeComponent(SelectedShip, godIndex);
    }
  );

  for (const key of NumberKeyNames) {
    input.onKeyPress(
      (keys) => keys.has(key),
      () => {
        const shipEntity = shipKeyRegistry.get(key);
        if (!shipEntity) return;
        setComponent(SelectedShip, godIndex, { value: shipEntity });
        const position = getComponentValue(Position, shipEntity);
        if (!position) return;
        camera.centerOn(position.x * posWidth, position.y * posHeight + 400);
      }
    );
  }

  input.rightClick$.subscribe((p) => {
    removeComponent(SelectedShip, godIndex);
  });

  world.registerDisposer(() => clickSub?.unsubscribe());
}
