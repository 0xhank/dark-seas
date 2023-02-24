import { createPhaserEngine, defineCameraConfig, defineScaleConfig } from "@latticexyz/phaserx";
import {
  EntityIndex,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { filter } from "rxjs";
import { world } from "../../../mud/world";
import { phaserConfig, sprites } from "../../../phaser/config";
import { POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../../phaser/constants";
import { SetupResult } from "../../../setupMUD";
import { Sprites } from "../../../types";
import { getShipSprite } from "../../../utils/ships";
import { colors } from "../../styles/global";

export async function createMinimap() {
  const { game, scenes, dispose } = await createPhaserEngine({
    ...phaserConfig,
    scale: defineScaleConfig({
      parent: "phaser-cutin",
      zoom: 1,
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    }),
    cameraConfig: defineCameraConfig({
      pinchSpeed: 0.5,
      wheelSpeed: 0,
      maxZoom: 1.5,
      minZoom: 0.1,
    }),
  });

  const { camera, phaserScene, input } = scenes.Main;

  world.registerDisposer(dispose);

  phaserScene.cameras.main.setZoom(1);
  // scene.phaserScene.cameras.main.setBounds(-500, -500, 1000, 1000, true);
  phaserScene.input.on(
    "wheel",
    (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: any, deltaY: number, deltaZ: any) => {
      const zoom = camera.phaserCamera.zoom;
      const zoomScale = deltaY < 0 ? 1.08 : 0.92;
      const newZoom = zoom * zoomScale; // deltaY>0 means we scrolled down

      if (deltaY >= 0 && newZoom < 0.1) return;
      if (deltaY <= 0 && newZoom > 1) return;

      camera.setZoom(newZoom);
    }
  );

  input.pointermove$.pipe(filter(({ pointer }) => pointer.isDown)).subscribe(({ pointer }) => {
    camera.setScroll(
      camera.phaserCamera.scrollX - (pointer.x - pointer.prevPosition.x) / camera.phaserCamera.zoom,
      camera.phaserCamera.scrollY - (pointer.y - pointer.prevPosition.y) / camera.phaserCamera.zoom
    );
  });

  return {
    game,
    scene: scenes.Main,
  };
}

export function renderMinimapShip(shipEntity: EntityIndex, scene: Phaser.Scene, mud: SetupResult) {
  const {
    components: { Length, MaxHealth, Cannon, OwnedBy, ActiveCannon },
    utils: { pixelCoord, getFiringAreaPixels },
    godEntity,
  } = mud;
  const position = { x: 0, y: 0 };
  const rotation = 315;
  const group = scene.add.group();
  const object = scene.add.sprite(position.x, position.y, "none");
  group.add(object);
  const length = getComponentValueStrict(Length, shipEntity).value;
  const maxHealth = getComponentValueStrict(MaxHealth, shipEntity).value;
  const spriteAsset: Sprites = getShipSprite(godEntity, maxHealth, maxHealth, true);

  const sprite = sprites[spriteAsset];

  const { x, y } = pixelCoord(position);

  object.setTexture(sprite.assetKey, sprite.frame);

  const shipLength = length * POS_WIDTH * 1.25;
  const shipWidth = shipLength / SHIP_RATIO;
  object.setAngle(rotation - 90);
  object.setOrigin(0.5, 0.92);
  object.setDisplaySize(shipWidth, shipLength);
  object.setPosition(x, y);
  object.setDepth(RenderDepth.Foreground5);
  scene.cameras.main.centerOn(position.x, position.y);
  const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];
  cannonEntities.forEach((cannonEntity) => {
    const length = getComponentValueStrict(Length, shipEntity).value;
    const firingArea = getFiringAreaPixels(position, rotation, length, cannonEntity);
    const firingPolygon = scene.add.polygon(undefined, undefined, firingArea, colors.whiteHex, 0.5);
    firingPolygon.setDisplayOrigin(0);
    firingPolygon.setDepth(RenderDepth.Foreground6);
    group.add(firingPolygon);

    firingPolygon.setInteractive(firingPolygon.geom, Phaser.Geom.Polygon.Contains);

    firingPolygon.on("pointerover", () => setComponent(ActiveCannon, godEntity, { value: cannonEntity }));
    firingPolygon.on("pointerout", () => removeComponent(ActiveCannon, godEntity));
  });

  scene.registry.set("ship", group);
}
