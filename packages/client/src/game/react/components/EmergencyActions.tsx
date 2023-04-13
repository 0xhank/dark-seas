import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID, EntityIndex, removeComponent, setComponent } from "@latticexyz/recs";
import { merge } from "rxjs";
import styled from "styled-components";
import { useGame } from "../../../mud/providers/GameProvider";
import { useOwner } from "../../../mud/providers/OwnerProvider";
import { Img, OptionButton, colors } from "../../../styles/global";
import { getMidpoint } from "../../../utils/trig";
import { ActionImg, ActionNames, ActionType, Phase } from "../..//types";

export function EmergencyActions() {
  const {
    components: {
      SelectedShip,
      LastAction,
      SelectedActions,
      OnFireLocal,
      DamagedCannonsLocal,
      SailPositionLocal,
      HoveredAction,
    },
    utils: { handleNewActionsSpecial, getSpriteObject, getPlayerEntity, getPhase, getTurn, isMyShip },
    gameEntity,
    network: { clock },

    scene: { camera },
  } = useGame();

  const ownerEntity = useOwner();

  const shipEntity = useComponentValue(SelectedShip, gameEntity)?.value as EntityIndex | undefined;
  const onFire = !!useComponentValue(OnFireLocal, shipEntity, { value: 0 }).value;
  const damagedCannons = !!useComponentValue(DamagedCannonsLocal, shipEntity, { value: 0 }).value;
  const tornSail = useComponentValue(SailPositionLocal, shipEntity, { value: 2 }).value == 0;
  const time = useObservableValue(clock.time$) || 0;
  useObservableValue(merge(camera.worldView$, camera.zoom$));
  const phase = getPhase(time);
  const turn = getTurn(time);

  const selectedActions = useComponentValue(SelectedActions, shipEntity) || {
    actionTypes: [ActionType.None, ActionType.None],
    specialEntities: ["0" as EntityID, "0" as EntityID],
  };

  const lastAction = useComponentValue(LastAction, getPlayerEntity(ownerEntity))?.value;

  if (phase !== Phase.Action || !shipEntity) return null;
  if (!isMyShip(shipEntity)) return null;
  if (!onFire && !damagedCannons && !tornSail) return null;
  const actionsExecuted = turn == lastAction;

  const cam = camera.phaserCamera;

  const shipObject = getSpriteObject(shipEntity);
  const front = { x: shipObject.x, y: shipObject.y };
  const angle = shipObject.angle + 90;
  const length = shipObject.displayHeight;
  const position = getMidpoint(front, angle, length);

  const x = Math.round(((position.x - cam.worldView.x) * cam.zoom) / 2);
  const y = Math.round(((position.y - cam.worldView.y) * cam.zoom) / 2) + (length / 4) * cam.zoom;

  const allActionsUsed = selectedActions.actionTypes.every((a) => a !== ActionType.None);

  const disabled = actionsExecuted || allActionsUsed;

  function ActionButton({ actionType }: { actionType: ActionType }) {
    const selected = !actionsExecuted && selectedActions.actionTypes.includes(actionType);
    if (!shipEntity) return null;
    return (
      <OptionButton
        isSelected={selected}
        disabled={disabled && !selected}
        confirmed={actionsExecuted}
        onMouseEnter={() =>
          setComponent(HoveredAction, gameEntity, { shipEntity: shipEntity, actionType, specialEntity: 0 })
        }
        onMouseLeave={() => removeComponent(HoveredAction, gameEntity)}
        onClick={(e) => {
          e.stopPropagation();
          handleNewActionsSpecial(actionType, shipEntity);
        }}
      >
        <Img src={ActionImg[actionType]} style={{ height: "35px" }} />
        <Sub>{ActionNames[actionType]}</Sub>
      </OptionButton>
    );
  }

  return (
    <DamageContainer top={y} left={x}>
      <p style={{ color: colors.red, fontWeight: "bolder", lineHeight: "1.25rem" }}>Emergencies</p>
      <div style={{ display: "flex", gap: "6px" }}>
        {onFire && <ActionButton actionType={ActionType.ExtinguishFire} />}
        {damagedCannons && <ActionButton actionType={ActionType.RepairCannons} />}
        {tornSail && <ActionButton actionType={ActionType.RepairSail} />}
      </div>
    </DamageContainer>
  );
}

const DamageContainer = styled.div<{ top: number; left: number }>`
  position: fixed;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  transform: translate(-50%, 0);

  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  background: ${colors.tan};
  border-radius: 6px;
  text-align: center;
  padding: 4px;
  filter: drop-shadow(0px 1px 3px ${colors.black});
  box-shadow: inset 0px 0px 3px ${colors.red};
`;

const Sub = styled.p`
  line-height: 1rem;
  font-size: 0.8rem;
  font-weight: bolder;
`;
