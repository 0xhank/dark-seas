import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { registerUIComponent } from "../../engine";
import { Container, InternalContainer } from "../../styles/global";
import { ShipCard } from "../YourShips/ShipCard";

export function registerEnemyShip() {
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
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer style={{ gap: "24px" }}>
            <ShipCard layers={layers} ship={ship} />
          </InternalContainer>
        </Container>
      );
    }
  );
}
