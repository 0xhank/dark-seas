import { getComponentValue, setComponent } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../../engine";
import { Button, colors } from "../../styles/global";
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
          components: { Name },
          network: { connectedAddress },
          utils: { getPlayerEntity },
        },
        backend: {
          godIndex,
          components: { LeaderboardOpen },
        },
      } = layers;

      return merge(of(0), Name.update$).pipe(
        map(() => {
          return {
            Name,
            world,
            connectedAddress,
            getPlayerEntity,
            godIndex,
            LeaderboardOpen,
          };
        })
      );
    },
    ({ Name, world, connectedAddress, getPlayerEntity, godIndex, LeaderboardOpen }) => {
      const dir: number = 0;
      const speed: number = 0;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;
      if (!name) return null;
      return (
        <TopBarContainer>
          <Compass direction={dir} speed={speed} />
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "8px" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}'s Log</span>
            <Button
              onClick={() => {
                setComponent(LeaderboardOpen, godIndex, { value: true });
              }}
              style={{ width: "40px", background: colors.thickGlass }}
            >
              {" "}
              <img src={"/icons/podium.svg"} style={{ width: "100%" }} />
            </Button>
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
