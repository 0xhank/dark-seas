import { GodID } from "@latticexyz/network";
import { Coord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
import { Sprites } from "../../../../types";
import { getShipSprite } from "../../../../utils/ships";
import { getFiringArea } from "../../../../utils/trig";
import { RenderDepth, SHIP_RATIO } from "../constants";
import { PhaserLayer } from "../types";

export function renderShip(
  phaser: PhaserLayer,
  shipEntity: EntityIndex,
  objectId: string,
  position: Coord,
  rotation: number,
  tint = 0xffffff,
  alpha = 1
) {
  const {
    world,
    parentLayers: {
      network: {
        components: { Length, Health },
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
  const health = getComponentValueStrict(Health, shipEntity).value;

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

export function renderFiringArea(
  phaser: PhaserLayer,
  group: Phaser.GameObjects.Group,
  position: Coord,
  rotation: number,
  length: number,
  cannonEntity: EntityIndex,
  tint = 0xffffff,
  alpha = 1
) {
  const {
    parentLayers: {
      network: {
        components: { Range, Rotation },
      },
    },
    scenes: {
      Main: { phaserScene },
    },
    positions,
  } = phaser;

  const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

  const cannonRotation = getComponentValueStrict(Rotation, cannonEntity).value;
  const range = getComponentValueStrict(Range, cannonEntity).value * positions.posHeight;

  const firingArea = getFiringArea(pixelPosition, range, length * positions.posHeight, rotation, cannonRotation);

  console.log("firing area:", firingArea);
  const firingPolygon = phaserScene.add.polygon(undefined, undefined, firingArea, 0xffffff, 0.1);
  firingPolygon.setDisplayOrigin(0);
  firingPolygon.setDepth(RenderDepth.Foreground5);
  firingPolygon.setFillStyle(tint, alpha);

  group.add(firingPolygon, true);
}

export function renderCircle(
  phaser: PhaserLayer,
  group: Phaser.GameObjects.Group,
  position: Coord,
  length: number,
  rotation: number,
  tint = 0xffffff,
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
    0xffc415,
    0.5
  );

  circle.setAngle(rotation % 360);
  circle.setOrigin(0.85, 0.5);
  circle.setDepth(RenderDepth.Foreground5);
  circle.setFillStyle(tint, alpha);

  group.add(circle, true);
}
