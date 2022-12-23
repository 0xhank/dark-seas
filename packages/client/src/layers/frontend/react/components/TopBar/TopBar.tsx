import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue } from "@latticexyz/recs";
import { useState } from "react";
import { map, merge, of } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../../engine";
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
        <TopBarContainer>
          <Compass direction={dir} speed={speed} />
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}'s Log</span>
            <span>{date.toLocaleDateString("en-UK", options as any)}</span>
          </div>
        </TopBarContainer>
      );
    }
  );
}

const TopBarContainer = styled.div`
  position: absolute;
  left: 20;
  top: 20;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
