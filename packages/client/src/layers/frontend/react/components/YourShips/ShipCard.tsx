import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { Layers, SailPositions } from "../../../../../types";
import { getShipSprite, ShipImages } from "../../../../../utils/ships";
import { BoxImage } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HullHealth from "../OverviewComponents/HullHealth";
import ShipAttribute from "../OverviewComponents/ShipAttribute";
import ShipDamage from "../OverviewComponents/ShipDamage";

export const ShipCard = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    network: {
      world,
      utils: { getPlayerEntity },
      network: { connectedAddress },
      components: {
        Health,
        SailPosition,
        CrewCount,
        DamagedMast,
        Firepower,
        Leak,
        OnFire,
        Rotation,
        Position,
        OwnedBy,
        Name,
      },
    },
  } = layers;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const playerEntity = getPlayerEntity(connectedAddress.get());
  const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, ship).value);
  if (!ownerEntity || !playerEntity) return null;

  const sailPosition = getComponentValueStrict(SailPosition, ship).value;
  const rotation = getComponentValueStrict(Rotation, ship).value;
  const position = getComponentValueStrict(Position, ship);
  const health = getComponentValueStrict(Health, ship).value;
  const crewCount = getComponentValueStrict(CrewCount, ship).value;
  const firepower = getComponentValueStrict(Firepower, ship).value;
  const onFire = getComponentValue(OnFire, ship)?.value;
  const leak = getComponentValue(Leak, ship)?.value;
  const damagedMast = getComponentValue(DamagedMast, ship)?.value;
  const ownerName = getComponentValue(Name, ownerEntity)?.value;

  return (
    <div style={{ display: "flex", borderRadius: "6px", width: "100%" }}>
      <BoxContainer>
        <span style={{ fontSize: "1.5rem", lineHeight: "1.5rem" }}>HMS {ship}</span>
        {playerEntity !== ownerEntity && <span>{ownerName}</span>}
        <BoxImage>
          <img
            src={ShipImages[getShipSprite(playerEntity, health, ownerEntity == playerEntity)]}
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
          <ShipAttribute attributeType={ShipAttributeTypes.Crew} attribute={crewCount} />
          <ShipAttribute attributeType={ShipAttributeTypes.Firepower} attribute={firepower} />
          <ShipAttribute attributeType={ShipAttributeTypes.Sails} attribute={SailPositions[sailPosition]} />
        </div>
        <div style={{ display: "flex" }}>
          {damagedMast && <ShipDamage message="mast broken" amountLeft={damagedMast} />}
          {onFire && <ShipDamage message="on fire" amountLeft={onFire} />}
          {leak && <ShipDamage message="leaking" />}
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
