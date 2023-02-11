import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../MUDContext";
import { usePlayer } from "../../../PlayerContext";
import { ActionType } from "../../../types";
import { getShipName, getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HullHealth from "./HullHealth";
import ShipAttribute from "./ShipAttribute";
import ShipDamage from "./ShipDamage";

export const ShipCard = ({ shipEntity }: { shipEntity: EntityIndex }) => {
  const {
    utils: { getPlayerEntity, getTurn },
    components: {
      MaxHealth,
      Rotation,
      OwnedBy,
      Name,
      Length,
      LastAction,
      Booty,
      SelectedActions,
      HealthLocal,
      OnFireLocal,
      SailPositionLocal,
      DamagedCannonsLocal,
    },
    network: { clock },
  } = useMUD();

  const playerEntity = usePlayer();
  const fakeOwner = "0" as EntityID;
  const ownerEntity = getPlayerEntity(useComponentValue(OwnedBy, shipEntity, { value: fakeOwner }).value);

  const sailPosition = useComponentValue(SailPositionLocal, shipEntity, { value: 2 }).value;
  const rotation = useComponentValue(Rotation, shipEntity, { value: 0 }).value;
  const health = useComponentValue(HealthLocal, shipEntity, { value: 0 })?.value || 0;
  const maxHealth = useComponentValue(MaxHealth, shipEntity, { value: 0 })?.value || 0;
  const onFire = useComponentValue(OnFireLocal, shipEntity, { value: 0 })?.value;
  const damagedCannons = useComponentValue(DamagedCannonsLocal, shipEntity, { value: 0 })?.value;
  const ownerName = useComponentValue(Name, ownerEntity, { value: fakeOwner })?.value;
  const selectedActions = useComponentValue(SelectedActions, shipEntity);
  const length = useComponentValue(Length, shipEntity)?.value || 10;

  const time = useObservableValue(clock.time$) || 0;
  const currentTurn = getTurn(time);
  const booty = useComponentValue(Booty, shipEntity)?.value;

  let actionsExecuted = false;
  if (playerEntity) {
    const lastAction = useComponentValue(LastAction, playerEntity)?.value;
    actionsExecuted = currentTurn == lastAction;
  }
  const updates = actionsExecuted ? undefined : selectedActions?.actionTypes;

  const updatedSailPosition = updates?.includes(ActionType.LowerSail)
    ? sailPosition - 1
    : updates?.includes(ActionType.RaiseSail)
    ? sailPosition + 1
    : sailPosition;

  const name = getShipName(shipEntity);
  if (!ownerEntity) return null;
  return (
    <div style={{ display: "flex", borderRadius: "6px", width: "100%" }}>
      <BoxContainer>
        <span style={{ fontSize: "1.5rem", lineHeight: "2.1rem" }}>{name}</span>
        {playerEntity !== ownerEntity && <span>{ownerName}</span>}
        <BoxImage>
          <img
            src={ShipImages[getShipSprite(ownerEntity, health, ownerEntity == playerEntity)]}
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
      </BoxContainer>
      <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: "3px" }}>
        <HullHealth health={health} maxHealth={maxHealth} />
        <div style={{ display: "flex", width: "100%", flexWrap: "wrap" }}>
          <ShipAttribute
            attributeType={ShipAttributeTypes.Sails}
            attribute={updatedSailPosition}
            updating={updatedSailPosition !== sailPosition}
          />
          <ShipAttribute attributeType={ShipAttributeTypes.Booty} attribute={booty ? Number(booty) : undefined} />
        </div>
        {health !== 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
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
        )}
      </div>
    </div>
  );
};

const BoxContainer = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 12rem;
  min-width: 8rem;
  padding-top: 6px;

  @media (max-width: 1500px) {
    max-width: 10rem;
  }
`;
