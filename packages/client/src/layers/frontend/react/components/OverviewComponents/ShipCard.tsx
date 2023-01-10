import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { ActionType, Layers } from "../../../../../types";
import { getShipSprite, ShipImages } from "../../../../../utils/ships";
import { BoxImage } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HullHealth from "./HullHealth";
import ShipAttribute from "./ShipAttribute";
import ShipDamage from "./ShipDamage";

export const ShipCard = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    network: {
      utils: { getPlayerEntity },
      network: { connectedAddress },
      components: { MaxHealth, Health, SailPosition, DamagedCannons, OnFire, Rotation, OwnedBy, Name },
    },
    backend: {
      components: { SelectedActions },
    },
  } = layers;

  const playerEntity = getPlayerEntity(connectedAddress.get());
  const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, ship).value);
  if (!ownerEntity || !playerEntity) return null;

  const sailPosition = getComponentValueStrict(SailPosition, ship).value;
  const rotation = getComponentValueStrict(Rotation, ship).value;
  const health = getComponentValueStrict(Health, ship).value;
  const maxHealth = getComponentValueStrict(MaxHealth, ship).value;
  const onFire = getComponentValue(OnFire, ship)?.value;
  const damagedCannons = getComponentValue(DamagedCannons, ship)?.value;
  const ownerName = getComponentValue(Name, ownerEntity)?.value;
  const selectedActions = getComponentValue(SelectedActions, ship);

  const updates = new Set(selectedActions?.actionTypes);

  const updatedSailPosition = updates.has(ActionType.LowerSail)
    ? sailPosition - 1
    : updates.has(ActionType.RaiseSail)
    ? sailPosition + 1
    : sailPosition;

  const name = maxHealth < 12 ? "The Weasel" : "Big Bertha";

  return (
    <div style={{ display: "flex", borderRadius: "6px", width: "100%" }}>
      <BoxContainer>
        <span style={{ fontSize: "1.5rem", lineHeight: "1.5rem" }}>{name}</span>
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
              maxWidth: "50px",
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
        </div>
        {health !== 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            {damagedCannons && (
              <ShipDamage
                message="cannons broken"
                amountLeft={damagedCannons}
                fixing={updates.has(ActionType.RepairCannons)}
              />
            )}
            {onFire && (
              <ShipDamage message="on fire" amountLeft={onFire} fixing={updates.has(ActionType.ExtinguishFire)} />
            )}
            {sailPosition == 0 && <ShipDamage message="sails torn" fixing={updates.has(ActionType.RepairSail)} />}
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
