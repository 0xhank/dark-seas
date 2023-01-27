import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getShipSprite } from "../../../../utils/ships";
import { getFiringArea } from "../../../../utils/trig";
import { colors } from "../../react/styles/global";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function renderShip(
  phaser: PhaserLayer,
  shipEntity: EntityIndex,
  objectId: string,
  position: Coord,
  rotation: number,
  tint = colors.whiteHex,
  alpha = 1
) {
  const {
    components: { Length, HealthLocal },
    scene: { config, posWidth, posHeight },
    utils: { getSpriteObject },
    godEntity,
  } = phaser;

  const object = getSpriteObject(objectId);

  const length = getComponentValueStrict(Length, shipEntity).value;
  const health = getComponentValueStrict(HealthLocal, shipEntity).value;

  const spriteAsset: Sprites = getShipSprite(godEntity, health, true);
  // @ts-expect-error doesnt recognize a sprite as a number
  const sprite = config.sprites[spriteAsset];

  const { x, y } = tileCoordToPixelCoord(position, posWidth, posHeight);

  object.setTexture(sprite.assetKey, sprite.frame);

  object.setAngle((rotation - 90) % 360);
  const shipLength = length * posWidth * 1.25;
  const shipWidth = shipLength / SHIP_RATIO;
  object.setOrigin(0.5, 0.92);
  object.setDisplaySize(shipWidth, shipLength);
  object.setPosition(x, y);
  object.setAlpha(alpha);
  object.setTint(tint);
  object.setDepth(RenderDepth.Foreground5);

  return object;
}

export function getFiringAreaPixels(
  phaser: PhaserLayer,
  position: Coord,
  rotation: number,
  length: number,
  cannonEntity: EntityIndex
) {
  const {
    components: { Range, Rotation },
    scene: { posWidth, posHeight },
  } = phaser;
  const range = (getComponentValue(Range, cannonEntity)?.value || 0) * posHeight;

  const pixelPosition = tileCoordToPixelCoord(position, posWidth, posHeight);
  const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;

  return getFiringArea(pixelPosition, range, length * posHeight, rotation, cannonRotation);
}

export function renderFiringArea(
  phaser: PhaserLayer,
  group: Phaser.GameObjects.Group,
  position: Coord,
  rotation: number,
  length: number,
  cannonEntity: EntityIndex,
  fill: { tint: number; alpha: number } | undefined = undefined,
  stroke: { tint: number; alpha: number } | undefined = undefined
) {
  const { phaserScene } = phaser.scene;

  const firingArea = getFiringAreaPixels(phaser, position, rotation, length, cannonEntity);
  const firingPolygon = phaserScene.add.polygon(undefined, undefined, firingArea, colors.whiteHex, 0.3);
  firingPolygon.setDisplayOrigin(0);
  firingPolygon.setDepth(RenderDepth.Foreground6);

  const geomPolygon = new Phaser.Geom.Polygon(
    firingArea.reduce((prev: number[], coord) => [...prev, coord.x, coord.y], [])
  );

  if (fill) {
    firingPolygon.setFillStyle(fill.tint, fill.alpha);
  }
  if (stroke) {
    firingPolygon.setStrokeStyle(6, stroke.tint, stroke.alpha);
  }

  group.add(firingPolygon, true);

  return firingPolygon;
}

export function renderCircle(
  phaser: PhaserLayer,
  group: Phaser.GameObjects.Group,
  position: Coord,
  length: number,
  rotation: number,
  tint = colors.whiteHex,
  alpha = 1
) {
  const {
    scene: { phaserScene, posWidth, posHeight },
  } = phaser;
  const circleWidth = length * posWidth * 1.5;
  const circleHeight = circleWidth / SHIP_RATIO;

  const circle = phaserScene.add.ellipse(
    position.x * posHeight,
    position.y * posHeight,
    circleWidth,
    circleHeight,
    colors.goldHex,
    0.5
  );

  circle.setAngle(rotation % 360);
  circle.setOrigin(0.85, 0.5);
  circle.setDepth(RenderDepth.Foreground5);
  circle.setFillStyle(tint, alpha);

  group.add(circle, true);
}

export function getRangeTintAlpha(loaded: boolean, selected: boolean, damaged: boolean) {
  if (damaged) return { tint: colors.blackHex, alpha: 0.2 };
  //UNSELECTED
  // Unloaded
  let fill = { tint: colors.whiteHex, alpha: 0.2 };

  // Loaded
  if (loaded) {
    fill = { tint: colors.goldHex, alpha: 0.4 };
  }
  //SELECTED
  if (selected) {
    //Unloaded
    fill = { tint: colors.goldHex, alpha: 0.7 };
    //Loaded
    if (loaded) fill = { tint: colors.cannonReadyHex, alpha: 0.7 };
  }
  return fill;
}
