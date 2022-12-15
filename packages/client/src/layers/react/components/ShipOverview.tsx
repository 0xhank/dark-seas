import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { SailPositions } from "../../../types";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { ShipAttributeTypes } from "../../phaser/constants";
import { registerUIComponent } from "../engine";
import { BoxImage, Container, InternalContainer } from "../styles/global";
import HullHealth from "./OverviewComponents/HullHealth";
import ShipAttribute from "./OverviewComponents/ShipAttribute";
import ShipDamage from "./OverviewComponents/ShipDamage";

export function registerShipOverview() {
  registerUIComponent(
    // name
    "ShipOverview",
    // grid location
    {
      rowStart: 1,
      rowEnd: 4,
      colStart: 10,
      colEnd: 13,
    },
    // requirement
    (layers) => {
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
            Player,
            Rotation,
            Position,
            Ship,
            OwnedBy,
            Name,
          },
        },
        phaser: {
          components: { SelectedShip },
          scenes: {
            Main: { camera },
          },
          positions,
        },
      } = layers;

      return merge(
        of(0),
        Rotation.update$,
        Position.update$,
        Ship.update$,
        OwnedBy.update$,
        Health.update$,
        SelectedShip.update$,
        SailPosition.update$,
        CrewCount.update$,
        DamagedMast.update$,
        Firepower.update$,
        Leak.update$,
        OnFire.update$,
        Player.update$
      ).pipe(
        map(() => {
          return {
            world,
            SelectedShip,
            Position,
            Rotation,
            OwnedBy,
            Health,
            SailPosition,
            CrewCount,
            DamagedMast,
            Firepower,
            Leak,
            Ship,
            OnFire,
            Name,
            Player,
            connectedAddress,
            camera,
            positions,
            getPlayerEntity,
          };
        })
      );
    },
    (props) => {
      const {
        SelectedShip,
        Rotation,
        Name,
        Position,
        Health,
        Player,
        CrewCount,
        Firepower,
        SailPosition,
        DamagedMast,
        OwnedBy,
        OnFire,
        Leak,
        world,
        connectedAddress,
        getPlayerEntity,
      } = props;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      if (!selectedShip) return null;

      const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, selectedShip).value);
      if (!ownerEntity || playerEntity == ownerEntity) return null;

      const sailPosition = getComponentValueStrict(SailPosition, selectedShip).value;
      const rotation = getComponentValueStrict(Rotation, selectedShip).value;
      const position = getComponentValueStrict(Position, selectedShip);
      const health = getComponentValueStrict(Health, selectedShip).value;
      const crewCount = getComponentValueStrict(CrewCount, selectedShip).value;
      const firepower = getComponentValueStrict(Firepower, selectedShip).value;
      const onFire = getComponentValue(OnFire, selectedShip)?.value;
      const leak = getComponentValue(Leak, selectedShip)?.value;
      const damagedMast = getComponentValue(DamagedMast, selectedShip)?.value;
      const ownerName = getComponentValue(Name, ownerEntity)?.value;

      return (
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer style={{ gap: "24px" }}>
            <div style={{ display: "flex", borderRadius: "6px", width: "100%", height: "100%" }}>
              <div
                style={{
                  flex: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  maxWidth: "140px",
                  minWidth: "80px",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: "2.5rem" }}>HMS {selectedShip}</span>
                {ownerName && <span style={{ lineHeight: "1.5rem", fontSize: "1rem" }}>{ownerName}</span>}
                <span style={{ lineHeight: "1.5rem", fontSize: "1rem" }}>
                  ({position.x}, {position.y})
                </span>
                <BoxImage>
                  <img
                    src={ShipImages[getShipSprite(playerEntity, ownerEntity, health)]}
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
          </InternalContainer>
        </Container>
      );
    }
  );
}
