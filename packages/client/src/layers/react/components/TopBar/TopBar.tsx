import React, { useState } from "react";
import { registerUIComponent } from "../../engine";
import { EntityIndex } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import { GodID } from "@latticexyz/network";
import styled from "styled-components";
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
          components: { Wind },
          network: { connectedAddress },
        },
      } = layers;

      return merge(of(0), Wind.update$).pipe(
        map(() => {
          return {
            Wind,
            world,
            connectedAddress,
          };
        })
      );
    },
    ({ Wind, world, connectedAddress }) => {
      const manyYearsAgo = 1000 * 60 * 60 * 24 * 265 * 322;
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };

      const [date, setDate] = useState<Date>(new Date(Date.now() - manyYearsAgo));
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);
      const dir: number = Wind.values.direction.get(GodEntityIndex) || 0;
      const speed: number = Wind.values.speed.get(GodEntityIndex) || 0;

      return (
        <Container>
          <Compass direction={dir} speed={speed} />
          <div
            style={{
              marginLeft: "360px",
              display: "flex",
              width: "100%",
              flexDirection: "column",
              gap: "5px",
              textAlign: "left",
            }}
          >
            <span style={{ fontWeight: "bolder", fontSize: "30px", lineHeight: "40px" }}>
              Captain {connectedAddress.get()?.slice(0, 7)}'s Log
            </span>
            <span>{date.toLocaleDateString("en-UK", options as any)}</span>
          </div>
        </Container>
      );
    }
  );
}
