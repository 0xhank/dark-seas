import { getComponentValue } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../../engine";
import { ShipAttributeTypes } from "../../types";
import ShipAttribute from "../OverviewComponents/ShipAttribute";

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
          components: { Name, Booty },
          network: { connectedAddress },
          utils: { getPlayerEntity },
        },
      } = layers;

      return merge(Name.update$, Booty.update$).pipe(
        map(() => {
          const playerEntity = getPlayerEntity(connectedAddress.get());
          if (!playerEntity) return;
          const booty = Number(getComponentValue(Booty, playerEntity)?.value);
          const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;

          if (!name) return null;
          return {
            name,
            booty,
          };
        })
      );
    },
    ({ name, booty }) => {
      return (
        <TopBarContainer>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "12px" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}</span>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
              {booty !== undefined && !isNaN(Number(booty)) && (
                <ShipAttribute attributeType={ShipAttributeTypes.Booty} attribute={Number(booty)} />
              )}
            </div>
          </div>
        </TopBarContainer>
      );
    }
  );
}

const TopBarContainer = styled.div`
  position: absolute;
  left: 12;
  top: 12;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
