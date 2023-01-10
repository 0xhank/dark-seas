import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
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
          world,
          utils: { getPlayerEntity },
          network: { connectedAddress },
          components: {
            MaxHealth,
            Health,
            SailPosition,
            DamagedCannons,
            Firepower,
            OnFire,
            Player,
            Rotation,
            Position,
            Ship,
            OwnedBy,
          },
        },
        backend: {
          components: { SelectedShip },
        },
      } = layers;

      return merge(
        of(0),
        Rotation.update$,
        Position.update$,
        Ship.update$,
        OwnedBy.update$,
        Health.update$,
        MaxHealth.update$,
        SelectedShip.update$,
        SailPosition.update$,
        DamagedCannons.update$,
        Firepower.update$,
        OnFire.update$,
        Player.update$
      ).pipe(
        map(() => {
          return {
            layers,
            getPlayerEntity,
            connectedAddress,
            OwnedBy,
            SelectedShip,
            world,
          };
        })
      );
    },
    ({ layers, getPlayerEntity, connectedAddress, OwnedBy, SelectedShip, world }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const ship = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;
      if (!ship) return null;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      const ownerEntity = getPlayerEntity(getComponentValueStrict(OwnedBy, ship).value);
      if (!ownerEntity || playerEntity == ownerEntity) return null;
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
