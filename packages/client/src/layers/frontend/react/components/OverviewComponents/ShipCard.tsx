import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { ActionType, Layers } from "../../../../../types";
import { getShipName, getShipSprite, ShipImages } from "../../../../../utils/ships";
import { DELAY } from "../../../constants";
import { BoxImage } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HullHealth from "./HullHealth";
import ShipAttribute from "./ShipAttribute";
import ShipDamage from "./ShipDamage";

export const ShipCard = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    network: {
      utils: { getPlayerEntity, getTurn },
      components: { MaxHealth, Rotation, OwnedBy, Name, Length, LastAction, Booty },
    },
    backend: {
      components: { SelectedActions, HealthLocal, OnFireLocal, SailPositionLocal, DamagedCannonsLocal },
    },
  } = layers;

  const playerEntity = getPlayerEntity();
  const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, ship).value);
  if (!ownerEntity || !playerEntity) return null;

  const sailPosition = getComponentValueStrict(SailPositionLocal, ship).value;
  const rotation = getComponentValueStrict(Rotation, ship).value;
  const health = getComponentValue(HealthLocal, ship)?.value || 0;
  const maxHealth = getComponentValue(MaxHealth, ship)?.value || 0;
  const onFire = getComponentValue(OnFireLocal, ship)?.value;
  const damagedCannons = getComponentValue(DamagedCannonsLocal, ship)?.value;
  const ownerName = getComponentValue(Name, ownerEntity)?.value;
  const selectedActions = getComponentValue(SelectedActions, ship);
  const length = getComponentValue(Length, ship)?.value || 10;
  const lastAction = getComponentValue(LastAction, playerEntity)?.value;
  const currentTurn = getTurn(DELAY);
  const booty = getComponentValue(Booty, ship)?.value;

  const actionsExecuted = currentTurn == lastAction;
  const updates = actionsExecuted ? undefined : selectedActions?.actionTypes;

  const updatedSailPosition = updates?.includes(ActionType.LowerSail)
    ? sailPosition - 1
    : updates?.includes(ActionType.RaiseSail)
    ? sailPosition + 1
    : sailPosition;

  const name = getShipName(ship);

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
