import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue } from "@latticexyz/recs";
import { useState } from "react";
import { map, merge, of } from "rxjs";
import { registerUIComponent } from "../../engine";
import { Container } from "../../styles/global";
import { Compass } from "./Compass";

export function registerTopBar() {
  registerUIComponent(
    // name
    "Top Bar",
    // grid location
    {
      rowStart: 1,
      rowEnd: 3,
      colStart: 1,
      colEnd: 5,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Wind, Name },
          network: { connectedAddress },
          utils: { getPlayerEntity },
        },
      } = layers;

      return merge(of(0), Wind.update$, Name.update$).pipe(
        map(() => {
          return {
            Wind,
            Name,
            world,
            connectedAddress,
            getPlayerEntity,
          };
        })
      );
    },
    ({ Wind, Name, world, connectedAddress, getPlayerEntity }) => {
      const manyYearsAgo = 1000 * 60 * 60 * 24 * 265 * 322;
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };

      const [date, setDate] = useState<Date>(new Date(Date.now() - manyYearsAgo));
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);
      const dir: number = Wind.values.direction.get(GodEntityIndex) || 0;
      const speed: number = Wind.values.speed.get(GodEntityIndex) || 0;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;
      if (!name) return null;
      return (
        <Container>
          <Compass direction={dir} speed={speed} />
          <div
            style={{
              marginLeft: "290px",
              display: "flex",
              width: "100%",
              flexDirection: "column",
              gap: "5px",
              textAlign: "left",
            }}
          >
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}'s Log</span>
            <span>{date.toLocaleDateString("en-UK", options as any)}</span>
          </div>
        </Container>
      );
    }
  );
}
