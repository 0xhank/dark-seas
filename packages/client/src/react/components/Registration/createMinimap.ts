import {
  Coord,
  createPhaserEngine,
  defineCameraConfig,
  defineScaleConfig,
  tileCoordToPixelCoord,
} from "@latticexyz/phaserx";
import {
  defineComponentSystem,
  EntityIndex,
  getComponentValue,
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
import { POS_HEIGHT, POS_WIDTH, RenderDepth } from "../../../phaser/constants";
import { SetupResult } from "../../../setupMUD";
import { Sprites } from "../../../types";
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

export function createMinimapSystems(scene: Phaser.Scene, mud: SetupResult) {
  const {
    playerAddress,
    components: { MaxHealth, Cannon, OwnedBy, Length, ActiveCannon, ActiveShip },
    utils: { getFiringAreaPixels, getShip, destroyGroupObject, getGroupObject, getSpriteObject },
    godEntity,
  } = mud;

  const position = { x: 0, y: 0 };
  const rotation = 315;

  defineComponentSystem(world, ActiveShip, ({ entity, value: [newVal] }) => {
    destroyGroupObject("cannons");
    destroyGroupObject("activeCannons");

    if (!newVal) return;
    const shipEntity = newVal.value as EntityIndex;
    renderShip(shipEntity, shipEntity, position, rotation);
    renderCannons();
    scene.cameras.main.centerOn(position.x, position.y);
  });

  function renderShip(
    shipEntity: EntityIndex,
    objectId: string | EntityIndex,
    position: Coord,
    rotation: number,
    tint = colors.whiteHex,
    alpha = 1
  ) {
    const length = getComponentValueStrict(Length, shipEntity).value;

    const container = getShip("the-ship", true, scene);
    const hullSprite = Sprites.HullSmall;
    const hullObject = getSpriteObject(`${objectId}-hull`, true, scene);

    container.add(hullObject);

    const hullTexture = sprites[hullSprite];
    hullObject.setOrigin(0.5, 0.92);
    hullObject.setTexture(hullTexture.assetKey, hullTexture.frame);
    hullObject.setPosition(0, 0);
    const sailTexture = Sprites.SailWhite;
    const sailSprite = sprites[sailTexture];
    const sailObject = getSpriteObject(`${objectId}-sail`, true, scene);
    const middle = -80;
    sailObject.setOrigin(0.5, 0);
    sailObject.setTexture(sailSprite.assetKey, sailSprite.frame);
    sailObject.setPosition(0, middle);
    sailObject.setDepth(RenderDepth.ShipSail);
    container.add(sailObject);

    const { x, y } = tileCoordToPixelCoord(position, POS_WIDTH, POS_HEIGHT);

    container.setAngle((rotation - 90) % 360);
    container.setScale(length / 6);
    container.setPosition(x, y);
    container.setAlpha(alpha);
    container.setDepth(RenderDepth.Foreground5);

    const nestTexture = Sprites.CrowsNest;
    const nestSprite = sprites[nestTexture];
    const nestObject = getSpriteObject(`${objectId}-nest`, true, scene);
    nestObject.setOrigin(0.5, 0);
    nestObject.setTexture(nestSprite.assetKey, nestSprite.frame);
    nestObject.setPosition(0, middle - 8);
    nestObject.setDepth(RenderDepth.ShipSail);
    container.add(nestObject);

    return hullObject;
  }
  function renderCannons(activeCannon?: EntityIndex) {
    const group = getGroupObject("cannons", true, scene);
    const shipEntity = getComponentValue(ActiveShip, godEntity)?.value as EntityIndex | undefined;
    if (!shipEntity) return;
    const cannonEntities = [...runQuery([Has(Cannon), HasValue(OwnedBy, { value: world.entities[shipEntity] })])];
    cannonEntities.forEach((cannonEntity) => {
      const length = getComponentValueStrict(Length, shipEntity).value;
      const firingArea = getFiringAreaPixels(position, rotation, length, cannonEntity);
      const firingPolygon = scene.add.polygon(undefined, undefined, firingArea, colors.whiteHex, 0.3);

      firingPolygon.setDisplayOrigin(0);
      firingPolygon.setDepth(RenderDepth.Foreground6);

      firingPolygon.setInteractive(firingPolygon.geom, Phaser.Geom.Polygon.Contains);

      firingPolygon.on("pointerover", () => {
        if (getComponentValue(ActiveCannon, godEntity)) return;
        setComponent(ActiveCannon, godEntity, { value: cannonEntity });
        firingPolygon.setFillStyle(colors.whiteHex, 0.7);
        firingPolygon.setStrokeStyle(3, colors.goldHex);
      });
      firingPolygon.on("pointerout", () => {
        removeComponent(ActiveCannon, godEntity);
        firingPolygon.setFillStyle(colors.whiteHex, 0.3);
        firingPolygon.setStrokeStyle(0, colors.goldHex);
      });
      group.add(firingPolygon);
    });

    return group;
  }
}
