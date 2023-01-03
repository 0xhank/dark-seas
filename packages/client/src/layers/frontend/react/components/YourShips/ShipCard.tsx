import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { ActionType, Layers, SailPositions } from "../../../../../types";
import { getShipSprite, ShipImages } from "../../../../../utils/ships";
import { BoxImage } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HullHealth from "../OverviewComponents/HullHealth";
import ShipAttribute from "../OverviewComponents/ShipAttribute";
import ShipDamage from "../OverviewComponents/ShipDamage";

export const ShipCard = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    network: {
      utils: { getPlayerEntity },
      network: { connectedAddress },
      components: { Health, SailPosition, DamagedCannons, OnFire, Rotation, OwnedBy, Name },
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
  const onFire = getComponentValue(OnFire, ship)?.value;
  const damagedCannons = getComponentValue(DamagedCannons, ship)?.value;
  const ownerName = getComponentValue(Name, ownerEntity)?.value;
  const selectedActions = getComponentValue(SelectedActions, ship);

  const updating = selectedActions?.actionTypes.find(
    (action) => action == ActionType.LowerSail || action == ActionType.RaiseSail
  );

  const updatedSailPosition =
    updating == ActionType.LowerSail
      ? sailPosition - 1
      : updating == ActionType.LowerSail
      ? sailPosition + 1
      : sailPosition;
  return (
    <div style={{ display: "flex", borderRadius: "6px", width: "100%" }}>
      <BoxContainer>
        <span style={{ fontSize: "1.5rem", lineHeight: "1.5rem" }}>HMS {ship}</span>
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
      <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <HullHealth health={health} />
        <div style={{ display: "flex", width: "100%", flexWrap: "wrap" }}>
          <ShipAttribute
            attributeType={ShipAttributeTypes.Sails}
            attribute={SailPositions[updatedSailPosition]}
            updating={!!updating}
          />
        </div>
        <div style={{ display: "flex" }}>
          {damagedCannons && <ShipDamage message="cannons broken" amountLeft={damagedCannons} />}
          {onFire && <ShipDamage message="on fire" amountLeft={onFire} />}
          {sailPosition == 0 && <ShipDamage message="sails torn" />}
        </div>
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

  @media (max-width: 1500px) {
    max-width: 10rem;
  }
`;
