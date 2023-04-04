import { Key, pixelCoordToTileCoord } from "@latticexyz/phaserx";
import {
  EntityIndex,
  Has,
  defineEnterSystem,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { POS_HEIGHT, POS_WIDTH } from "../phaser/constants";
import { SetupResult } from "../types";

export function inputSystems(MUD: SetupResult) {
  const {
    world,
    components: { SelectedShip, Position, OwnedBy },
    utils: { getOwnerEntity, inGame },
    gameEntity,
    scene: {
      input,
      camera,
      maps: {
        Main: { tileWidth, tileHeight },
      },
    },
  } = MUD;

  const shipKeyRegistry = new Map<Key, EntityIndex>();
  const NumberKeyNames: Key[] = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];

  defineEnterSystem(world, [Has(Position), Has(OwnedBy)], ({ entity }) => {
    if (!inGame(entity)) return;
    const owner = getComponentValueStrict(OwnedBy, entity).value;
    const ownerEntity = getOwnerEntity();
    if (!ownerEntity) return;
    if (owner != world.entities[ownerEntity]) return;

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
      removeComponent(SelectedShip, gameEntity);
    }
  );

  for (const key of NumberKeyNames) {
    input.onKeyPress(
      (keys) => keys.has(key),
      () => {
        const shipEntity = shipKeyRegistry.get(key);
        if (!shipEntity) return;
        setComponent(SelectedShip, gameEntity, { value: shipEntity });
        const position = getComponentValue(Position, shipEntity);
        if (!position) return;
        camera.centerOn(position.x * POS_WIDTH, position.y * POS_HEIGHT);
      }
    );
  }

  input.rightClick$.subscribe((p) => {
    removeComponent(SelectedShip, gameEntity);
  });

  world.registerDisposer(() => clickSub?.unsubscribe());
}
