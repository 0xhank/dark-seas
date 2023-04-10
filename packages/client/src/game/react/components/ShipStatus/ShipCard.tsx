import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { usePhaser } from "../../../../mud/providers/PhaserProvider";
import { BoxImage, colors } from "../../../../styles/global";
import { ActionType } from "../../..//types";
import { ShipImages, getShipSprite } from "../../..//utils/ships";
import { ShipAttributeTypes } from "../../types";
import PillBar from "../PillBar";
import ShipAttribute from "./ShipAttribute";
import ShipDamage from "./ShipDamage";

function DamageDisplay({ shipEntity, updates }: { shipEntity: EntityIndex; updates: ActionType[] | undefined }) {
  const {
    components: { DamagedCannonsLocal, OnFireLocal, HealthLocal, SailPositionLocal },
  } = usePhaser();
  const damagedCannons = useComponentValue(DamagedCannonsLocal, shipEntity, { value: 0 }).value;
  const onFire = useComponentValue(OnFireLocal, shipEntity, { value: 0 }).value;
  const health = useComponentValue(HealthLocal, shipEntity, { value: 0 }).value;
  const sailPosition = useComponentValue(SailPositionLocal, shipEntity, { value: 2 }).value;

  if (health == 0) return null;
  if (!damagedCannons && !onFire && sailPosition == 2) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
      {damagedCannons !== undefined && (
        <ShipDamage
          message="cannons broken"
          amountLeft={damagedCannons}
          fixing={updates?.includes(ActionType.RepairCannons)}
        />
      )}
      {onFire !== undefined && (
        <ShipDamage message="on fire" amountLeft={onFire} fixing={updates?.includes(ActionType.ExtinguishFire)} />
      )}
      {sailPosition == 0 && <ShipDamage message="sails torn" fixing={updates?.includes(ActionType.RepairSail)} />}
    </div>
  );
}

export const ShipCard = ({ shipEntity }: { shipEntity: EntityIndex }) => {
  const {
    utils: { getOwnerEntity, getTurn, getShipName, getPlayerEntity },
    components: {
      MaxHealth,
      Rotation,
      OwnedBy,
      Name,
      Length,
      LastAction,
      SelectedActions,
      HealthLocal,
      SailPositionLocal,
    },
    network: { clock },
  } = usePhaser();

  const ownerEntity = useOwner();
  const fakeOwner = "0" as EntityID;
  const ownerId = useComponentValue(OwnedBy, shipEntity, { value: fakeOwner }).value;
  const shipOwnerEntity = getOwnerEntity(ownerId);
  const rotation = useComponentValue(Rotation, shipEntity, { value: 0 }).value;
  const health = useComponentValue(HealthLocal, shipEntity, { value: 0 })?.value || 0;
  const maxHealth = useComponentValue(MaxHealth, shipEntity, { value: 0 })?.value || 0;
  const ownerName = useComponentValue(Name, shipOwnerEntity, { value: fakeOwner })?.value;
  const selectedActions = useComponentValue(SelectedActions, shipEntity);
  const length = useComponentValue(Length, shipEntity)?.value || 10;
  const sailPosition = useComponentValue(SailPositionLocal, shipEntity, { value: 2 }).value;

  const time = useObservableValue(clock.time$) || 0;
  const currentTurn = getTurn(time);
  const lastAction = useComponentValue(LastAction, getPlayerEntity(ownerEntity))?.value;
  const actionsExecuted = currentTurn == lastAction;
  const updates = actionsExecuted ? undefined : selectedActions?.actionTypes;

  const updatedSailPosition = updates?.includes(ActionType.LowerSail)
    ? sailPosition - 1
    : updates?.includes(ActionType.RaiseSail)
    ? sailPosition + 1
    : sailPosition;

  const name = getShipName(shipEntity);
  if (!shipOwnerEntity) return null;
  return (
    <BoxContainer>
      {shipOwnerEntity !== ownerEntity && (
        <span style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>{ownerName}'s</span>
      )}
      <span style={{ fontSize: "1.25rem", lineHeight: "2rem" }}>{name}</span>
      <PillBar stat={health} maxStat={maxHealth} />
      <BoxImage length={length}>
        <img
          src={ShipImages[getShipSprite(shipOwnerEntity, health, maxHealth, shipOwnerEntity == ownerEntity)]}
          style={{
            objectFit: "scale-down",
            left: "50%",
            position: "absolute",
            top: "50%",
            margin: "auto",
            transform: `rotate(${rotation - 90}deg) translate(-50%,-50%)`,
            transformOrigin: `top left`,
            maxWidth: `${3.5 * length}px`,
          }}
        />
      </BoxImage>
      <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: "3px" }}>
        <div style={{ display: "flex", width: "100%", flexWrap: "wrap", paddingTop: "4px" }}>
          <ShipAttribute
            attributeType={ShipAttributeTypes.Sails}
            attribute={updatedSailPosition}
            updating={updatedSailPosition !== sailPosition}
          />
        </div>
        <DamageDisplay shipEntity={shipEntity} updates={updates} />
      </div>
    </BoxContainer>
  );
};

const BoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 6px;
`;
