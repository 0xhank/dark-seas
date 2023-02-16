import {
  defineComponentSystem,
  defineRxSystem,
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { world } from "../../mud/world";
import { POS_WIDTH, RenderDepth, SHIP_RATIO } from "../../phaser/constants";
import { colors } from "../../react/styles/global";
import { SetupResult } from "../../setupMUD";
import { ActionNames, ActionType, Phase } from "../../types";
import { getMidpoint } from "../../utils/trig";

export function raiseLowerSailSystems(MUD: SetupResult) {
  const {
    components: {
      SailPositionLocal,
      SelectedShip,
      Position,
      Rotation,
      Length,
      HoveredAction,
      LastAction,
      SelectedActions,
    },
    utils: {
      getGroupObject,
      secondsUntilNextPhase,
      destroyGroupObject,
      getPhase,
      isMyShip,
      pixelCoord,
      handleNewActionsSpecial,
      getGameConfig,
      getTurn,
      getPlayerEntity,
    },
    network: { clock },
    scene: { phaserScene },
    godEntity,
  } = MUD;

  defineComponentSystem(world, SailPositionLocal, ({ entity: shipEntity }) => {
    renderSailButton(shipEntity);
  });

  defineComponentSystem(world, LastAction, ({ entity: shipEntity }) => {
    renderSailButton(shipEntity);
  });

  defineComponentSystem(world, SelectedActions, ({ entity: shipEntity }) => {
    renderSailButton(shipEntity);
  });

  defineComponentSystem(world, HoveredAction, ({ entity, value: [newVal, oldVal] }) => {
    const oldActionIncludesSails =
      oldVal?.actionType == ActionType.RaiseSail || oldVal?.actionType == ActionType.LowerSail;
    if (oldActionIncludesSails) return renderSailButton(oldVal.shipEntity as EntityIndex);

    const newActionIncludesSails =
      newVal?.actionType == ActionType.RaiseSail || newVal?.actionType == ActionType.LowerSail;
    if (newActionIncludesSails) return renderSailButton(newVal.shipEntity as EntityIndex);
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
    const passed = shipEntity == selectedShip && !!sailPosition && isMyShip(shipEntity);
    console.log(`shipEntity ${passed ? "passed" : "failed"}`);
    return passed;
  }

  function renderSailButton(shipEntity: EntityIndex) {
    const groupId = `sailbutton-${shipEntity}`;
    if (!checkRenderReqs(shipEntity)) return destroySailButton(shipEntity);
    const shipFront = getComponentValueStrict(Position, shipEntity);
    const rotation = getComponentValueStrict(Rotation, shipEntity).value;
    const length = getComponentValueStrict(Length, shipEntity).value * POS_WIDTH;
    const sailPosition = getComponentValueStrict(SailPositionLocal, shipEntity)?.value || 0;
    const actionType = sailPosition == 1 ? ActionType.RaiseSail : ActionType.LowerSail;
    const width = length / SHIP_RATIO;
    const middle = getMidpoint(pixelCoord(shipFront), rotation, length * 1.3);
    const objects = renderCircleAndText(shipEntity, middle, width, actionType);
    if (!objects) return;
    const group = getGroupObject(groupId, true);

    objects.forEach((object) => group.add(object, true));
  }

  function destroySailButton(shipEntity: EntityIndex) {
    const groupId = `sailbutton-${shipEntity}`;
    destroyGroupObject(groupId);
  }

  function renderCircleAndText(shipEntity: EntityIndex, position: Coord, width: number, actionType: ActionType) {
    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;
    const lastAction = getComponentValue(LastAction, playerEntity)?.value;
    const selectedActions = getComponentValue(SelectedActions, shipEntity) || {
      actionTypes: [ActionType.None, ActionType.None],
      specialEntities: ["0" as EntityID, "0" as EntityID],
    };
    const hovered = getComponentValue(HoveredAction, godEntity)?.actionType == actionType;
    console.log("hovered:", hovered);
    const actionsExecuted = getTurn(clock.currentTime) == lastAction;
    const selected = !actionsExecuted && selectedActions.actionTypes.includes(actionType);
    const allActionsUsed = selectedActions.actionTypes.every((a) => a !== ActionType.None);
    const disabled = actionsExecuted || allActionsUsed;

    const circleHue = selected ? colors.goldHex : actionsExecuted ? colors.greenHex : colors.whiteHex;
    const hoverBonus = !disabled && hovered ? 0.1 : 0;
    const circleOpacity = disabled ? 0.3 : 0.6;

    const textOpacity = disabled ? 0.4 : 1;
    const circle = phaserScene.add.circle(position.x, position.y, width / 2, circleHue, circleOpacity + hoverBonus);
    circle.setDepth(RenderDepth.Foreground2);
    circle.setInteractive({ cursor: "pointer" });

    circle.on("pointerdown", () => handleNewActionsSpecial(actionType, shipEntity), phaserScene);
    // circle.on(
    //   "pointerover",
    //   () => setComponent(HoveredAction, godEntity, { shipEntity, actionType, specialEntity: 0 }),
    //   phaserScene
    // );
    // circle.on("pointerout", () => removeComponent(HoveredAction, godEntity), phaserScene);

    const text = ActionNames[actionType];
    const textObject = phaserScene.add.text(position.x, position.y, text, {
      fontSize: `${width / 4}px`,
      color: colors.darkBrown,
      align: "center",
      fontFamily: "Inknut",
    });
    textObject.setAlpha(textOpacity);
    textObject.setDepth(RenderDepth.Foreground1);
    Phaser.Display.Align.In.Center(textObject, circle);

    return [circle, textObject];
  }
}
