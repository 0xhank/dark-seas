import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { Layers, SailPositions } from "../../../../types";
import { getShipSprite, ShipImages } from "../../../../utils/ships";
import { ShipAttributeTypes } from "../../../phaser/constants";
import { BoxImage } from "../../styles/global";
import HullHealth from "../OverviewComponents/HullHealth";
import ShipAttribute from "../OverviewComponents/ShipAttribute";
import ShipDamage from "../OverviewComponents/ShipDamage";

export const ShipCard = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
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
  } = layers.network;

  const {
    components: { SelectedShip },
  } = layers.phaser;

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const playerEntity = getPlayerEntity(connectedAddress.get());
  const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, ship).value);
  if (!ownerEntity) return null;

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
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          maxWidth: "120px",
          minWidth: "80px",
        }}
      >
        <span style={{ fontSize: "1.5rem", lineHeight: "1.5rem" }}>HMS {ship}</span>
        {playerEntity !== ownerEntity && <span>{ownerName}</span>}
        <BoxImage>
          <img
            src={ShipImages[getShipSprite(GodEntityIndex, GodEntityIndex, health)]}
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
      </div>
      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
        <HullHealth health={health} />
        <div style={{ display: "flex", width: "100%" }}>
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