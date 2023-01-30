import { getComponentValue, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../../engine";
import { Button, colors } from "../../styles/global";
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
        backend: {
          godEntity,
          components: { LeaderboardOpen },
        },
      } = layers;

      return merge(Name.update$, Booty.update$).pipe(
        map(() => {
          const playerEntity = getPlayerEntity(connectedAddress.get());
          if (!playerEntity) return;
          const booty = Number(getComponentValueStrict(Booty, playerEntity).value);
          const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;
          const openLeaderboard = () => setComponent(LeaderboardOpen, godEntity, { value: true });

          if (!name) return null;
          return {
            name,
            booty,
            openLeaderboard,
          };
        })
      );
    },
    ({ name, booty, openLeaderboard }) => {
      return (
        <TopBarContainer>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "8px" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}'s Log</span>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <Button onClick={openLeaderboard} style={{ width: "40px", background: colors.thickGlass }}>
                <img src={"/icons/podium.svg"} style={{ width: "100%" }} />
              </Button>
              <ShipAttribute attributeType={ShipAttributeTypes.Booty} attribute={booty} />
            </div>
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
