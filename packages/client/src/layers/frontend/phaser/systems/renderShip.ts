import { GodID } from "@latticexyz/network";
import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
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
    world,
    parentLayers: {
      network: {
        components: { Length },
      },
      backend: {
        components: { LocalHealth },
      },
    },
    scenes: {
      Main: { objectPool, config },
    },
    positions,
  } = phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const object = objectPool.get(objectId, "Sprite");

  const length = getComponentValueStrict(Length, shipEntity).value;
  const health = getComponentValueStrict(LocalHealth, shipEntity).value;

  const spriteAsset: Sprites = getShipSprite(GodEntityIndex, health, true);
  // @ts-expect-error doesnt recognize a sprite as a number
  const sprite = config.sprites[spriteAsset];

  const { x, y } = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

  object.setComponent({
    id: `projection-${shipEntity}`,
    once: async (gameObject) => {
      gameObject.setTexture(sprite.assetKey, sprite.frame);

      gameObject.setAngle((rotation - 90) % 360);
      const shipLength = length * positions.posWidth * 1.25;
      const shipWidth = shipLength / SHIP_RATIO;
      gameObject.setOrigin(0.5, 0.92);
      gameObject.setDisplaySize(shipWidth, shipLength);
      gameObject.setPosition(x, y);
      gameObject.setAlpha(alpha);
      gameObject.setTint(tint);
      gameObject.setDepth(RenderDepth.Foreground5);
    },
  });

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
    parentLayers: {
      network: {
        components: { Range, Rotation },
      },
    },
    positions,
  } = phaser;
  const range = getComponentValueStrict(Range, cannonEntity).value * positions.posHeight;

  const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);
  const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;

  return getFiringArea(pixelPosition, range, length * positions.posHeight, rotation, cannonRotation);
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
  const { phaserScene } = phaser.scenes.Main;

  const firingArea = getFiringAreaPixels(phaser, position, rotation, length, cannonEntity);
  const firingPolygon = phaserScene.add.polygon(undefined, undefined, firingArea, colors.whiteHex, 0.1);
  firingPolygon.setDisplayOrigin(0);
  firingPolygon.setDepth(RenderDepth.Foreground6);
  if (fill) {
    firingPolygon.setFillStyle(fill.tint, fill.alpha);
  }
  if (stroke) {
    firingPolygon.setStrokeStyle(6, stroke.tint, stroke.alpha);
  }

  group.add(firingPolygon, true);
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
    scenes: {
      Main: { phaserScene },
    },
    positions,
  } = phaser;
  const circleWidth = length * positions.posWidth * 1.5;
  const circleHeight = circleWidth / SHIP_RATIO;

  const circle = phaserScene.add.ellipse(
    position.x * positions.posHeight,
    position.y * positions.posHeight,
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
    fill = { tint: colors.goldHex, alpha: 0.5 };
  }
  //SELECTED
  if (selected) {
    //Unloaded
    fill = { tint: colors.goldHex, alpha: 0.5 };
    //Loaded
    if (loaded) fill = { tint: colors.cannonReadyHex, alpha: 0.5 };
  }
  return fill;
}
