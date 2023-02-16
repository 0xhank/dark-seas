import {
  defineComponentSystem,
  defineRxSystem,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { world } from "../../mud/world";
import { POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { ActionType, Phase } from "../../types";
import { getMidpoint } from "../../utils/trig";

export function raiseLowerSailSystems(MUD: SetupResult) {
  const {
    components: { SailPositionLocal, SelectedShip, Position, Rotation, Length, HoveredAction },
    utils: {
      getGroupObject,
      secondsUntilNextPhase,
      destroyGroupObject,
      getPhase,
      isMyShip,
      pixelCoord,
      handleNewActionsSpecial,
      getGameConfig,
    },
    network: { clock },
    scene: { phaserScene },
    godEntity,
  } = MUD;

  defineComponentSystem(world, SailPositionLocal, ({ entity: shipEntity, value: [newVal, oldVal] }) => {
    if (!newVal || !oldVal) return;

    renderSailButton(shipEntity);
  });

  defineComponentSystem(world, SelectedShip, ({ entity, value: [newVal, oldVal] }) => {
    if (oldVal) destroySailButton(oldVal.value as EntityIndex);
    if (!newVal) return;

    renderSailButton(newVal.value as EntityIndex);
  });

  defineRxSystem(world, clock.time$, (time) => {
    const gameConfig = getGameConfig();
    const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;
    if (!gameConfig || !selectedShip) return;
    const phase = getPhase(time);
    const timeToNextPhase = secondsUntilNextPhase(time);

    if (phase == Phase.Commit && timeToNextPhase == gameConfig.commitPhaseLength) {
      destroySailButton(selectedShip);
    }

    if (phase == Phase.Action && timeToNextPhase == gameConfig.actionPhaseLength) {
      renderSailButton(selectedShip);
    }
  });

  function checkRenderReqs(shipEntity: EntityIndex) {
    const phase = getPhase(clock.currentTime);
    const selectedShip = getComponentValue(SelectedShip, godEntity)?.value;
    const sailPosition = getComponentValue(SailPositionLocal, shipEntity)?.value;
    return shipEntity == selectedShip && !!sailPosition && phase == Phase.Action && isMyShip(shipEntity);
  }

  function renderSailButton(shipEntity: EntityIndex) {
    const groupId = `sailbutton-${shipEntity}`;

    if (!checkRenderReqs(shipEntity)) return destroyGroupObject(groupId);
    const group = getGroupObject(groupId, true);
    const shipFront = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value * POS_WIDTH;
    const sailPosition = getComponentValueStrict(SailPositionLocal, shipEntity)?.value || 0;
    const actionType = sailPosition == 1 ? ActionType.RaiseSail : ActionType.LowerSail;
    const width = length / SHIP_RATIO;
    const middle = getMidpoint(pixelCoord(shipFront), rotation, length * 1.3);

    const circle = phaserScene.add.circle(middle.x, middle.y, width / 2, colors.whiteHex, 0.5);
    const text = sailPosition == 1 ? `Raise\nSail` : `Lower\nSail`;
    const textObject = phaserScene.add.text(middle.x, middle.y, text, {
      fontSize: `${width / 4}px`,
      color: colors.darkBrown,
      align: "center",
      fontFamily: "Inknut",
    });
    circle.setDepth(RenderDepth.Foreground2);
    circle.setInteractive({ cursor: "pointer" });
    circle.on("pointerdown", () => handleNewActionsSpecial(actionType, shipEntity));
    circle.on("pointerover", () =>
      setComponent(HoveredAction, godEntity, { shipEntity: shipEntity, actionType, specialEntity: 0 })
    );
    circle.on("pointerout", () => () => removeComponent(HoveredAction, godEntity));
    textObject.setDepth(RenderDepth.Foreground1);
    console.log("adding circle");
    Phaser.Display.Align.In.Center(textObject, circle);
    group.add(circle);
    group.add(textObject);
  }

  function destroySailButton(shipEntity: EntityIndex) {
    const groupId = `sailbutton-${shipEntity}`;
    destroyGroupObject(groupId);
  }
}
