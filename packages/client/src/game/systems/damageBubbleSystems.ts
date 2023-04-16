import { defineComponentSystem, EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { colors } from "../../styles/global";
import { getMidpoint } from "../../utils/trig";
import { world } from "../../world";
import { MOVE_LENGTH, POS_WIDTH, RenderDepth } from "../phaser/constants";
import { SetupResult } from "../types";
export function damageBubbleSystems(MUD: SetupResult) {
  const {
    components: { SailPositionLocal, DamagedCannonsLocal, OnFireLocal, Position, Length, HealthLocal, Rotation },
    utils: { destroyGroupObject, getGroupObject, pixelCoord, inGame },
    scene: { phaserScene },
  } = MUD;

  defineComponentSystem(world, SailPositionLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    const groupId = `${shipEntity}-tornsailbubble`;
    if (getComponentValue(HealthLocal, shipEntity)?.value == 0) return;
    if (!newVal || newVal.value > 0) return destroyGroupObject(groupId);
    renderBubble(shipEntity, groupId, "SAILS TORN", 0);
  });

  defineComponentSystem(world, DamagedCannonsLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    const groupId = `${shipEntity}-cannonsbubble`;
    if (getComponentValue(HealthLocal, shipEntity)?.value == 0) return;
    if (!newVal || newVal.value == 0) return destroyGroupObject(groupId);
    renderBubble(shipEntity, groupId, "CANNONS BROKEN", 1);
  });

  defineComponentSystem(world, OnFireLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    const groupId = `${shipEntity}-firebubble`;
    if (getComponentValue(HealthLocal, shipEntity)?.value == 0) return;
    if (!newVal || newVal.value == 0) return destroyGroupObject(groupId);
    renderBubble(shipEntity, groupId, "ON FIRE", 2);
  });

  defineComponentSystem(world, Position, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    if (!inGame(shipEntity)) return;
    if (!newVal) return;
    if (getComponentValue(HealthLocal, shipEntity)?.value == 0) return;
    const damagedCannons = getComponentValue(DamagedCannonsLocal, shipEntity)?.value || 0;
    const sailPosition = getComponentValue(SailPositionLocal, shipEntity)?.value || 2;
    const onFire = getComponentValue(OnFireLocal, shipEntity)?.value || 0;
    if (damagedCannons) {
      moveElement(shipEntity, `${shipEntity}-cannonsbubble`, "CANNONS BROKEN", 0);
    }
    if (sailPosition == 0) {
      moveElement(shipEntity, `${shipEntity}-tornsailbubble`, "SAILS TORN", 1);
    }
    if (onFire > 0) {
      moveElement(shipEntity, `${shipEntity}-firebubble`, "ON FIRE", 2);
    }
  });

  defineComponentSystem(world, HealthLocal, ({ entity: shipEntity, value: [newVal] }) => {
    if (!newVal) return;
    if (newVal == undefined || newVal.value !== 0) return;

    destroyGroupObject(`${shipEntity}-cannonsbubble`);
    destroyGroupObject(`${shipEntity}-tornsailbubble`);
    destroyGroupObject(`${shipEntity}-firebubble`);
  });

  async function moveElement(shipEntity: EntityIndex, objectId: string, msg: string, index: number) {
    destroyGroupObject(objectId);
    await new Promise((resolve) => setTimeout(resolve, MOVE_LENGTH));
    renderBubble(shipEntity, objectId, msg, index);
  }

  async function renderBubble(shipEntity: EntityIndex, groupId: string, msg: string, index: number) {
    const shipFront = getComponentValueStrict(Position, shipEntity);
    const length = getComponentValueStrict(Length, shipEntity).value * POS_WIDTH;
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const middle = getMidpoint(pixelCoord(shipFront), rotation, length);

    const bubble = phaserScene.add.graphics({ x: middle.x, y: middle.y });
    bubble.fillStyle(colors.redHex, 1);
    const bubbleWidth = msg.length * 28;
    const bubbleHeight = 60;
    const bubblePadding = 5;
    const arrowHeight = bubbleHeight / 3;
    bubble.fillRoundedRect(0, -bubbleHeight, bubbleWidth, bubbleHeight, 12);

    //  Calculate arrow coordinates
    const point1X = Math.floor(bubbleWidth / 12);
    const point1Y = 0;
    const point2X = point1X * 2;
    const point2Y = 0;
    const point3X = point1X;
    const point3Y = arrowHeight;

    //  Bubble arrow fill
    bubble.fillTriangle(point1X, point1Y, point2X, point2Y, point3X, point3Y);

    const content = phaserScene.add.text(middle.x, middle.y, msg, {
      fontFamily: "Inknut Antiqua",
      fontSize: "30px",
      color: colors.white,
      align: "center",
      wordWrap: { width: bubbleWidth - bubblePadding * 2 },
    });
    content.setOrigin(0.5, 1.2);
    content.setX(bubbleWidth / 2 + middle.x);
    const b = content.getBounds();

    const group = getGroupObject(groupId, true);
    group.add(bubble);
    group.add(content);
    group.setDepth(RenderDepth.Foreground2);

    const modulatedTime = Date.now() % 3000;

    const delay = (index * 1000 - modulatedTime + 12000) % 3000;
    if (group.getChildren().entries()) {
      group.setAlpha(0);
      await new Promise((resolve) => setTimeout(resolve, delay));
      group.setAlpha(1);
    }
    phaserScene.tweens.add({
      targets: group.getChildren(),
      props: {
        y: middle.y - bubbleHeight * 3,
        alpha: 0,
      },

      ease: Phaser.Math.Easing.Quadratic.Out,
      duration: 3000,
      repeat: -1,
    });
  }
}
