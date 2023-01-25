import { EntityIndex, getComponentValue } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { registerUIComponent } from "../engine";
import { Container, InternalContainer } from "../styles/global";
import { ShipCard } from "./OverviewComponents/ShipCard";

export function registerEnemyShip() {
  registerUIComponent(
    // name
    "EnemyShip",
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
          components: { MaxHealth, Firepower, Player, Rotation, Position, Ship, OwnedBy },
        },
        backend: {
          components: {
            HoveredShip,
            HealthLocal,
            OnFireLocal: OnFire,
            DamagedCannonsLocal: DamagedCannons,
            SailPositionLocal: SailPosition,
          },
          godIndex,
          utils: { isMyShip },
        },
      } = layers;

      return merge(
        of(0),
        Rotation.update$,
        Position.update$,
        Ship.update$,
        OwnedBy.update$,
        HealthLocal.update$,
        MaxHealth.update$,
        HoveredShip.update$,
        SailPosition.update$,
        DamagedCannons.update$,
        Firepower.update$,
        OnFire.update$,
        Player.update$
      ).pipe(
        map(() => {
          const ship = getComponentValue(HoveredShip, godIndex)?.value as EntityIndex | undefined;
          if (!ship) return null;

          if (isMyShip(ship)) return null;
          return {
            layers,
            ship,
          };
        })
      );
    },
    ({ layers, ship }) => {
      return (
        <Container style={{ justifyContent: "flex-start" }}>
          <InternalContainer style={{ gap: "24px", height: "auto" }}>
            <ShipCard layers={layers} ship={ship} />
          </InternalContainer>
        </Container>
      );
    }
  );
}
