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
          components: { Name },
          utils: { getPlayerEntity, activeNetwork },
        },
        backend: {
          godIndex,
          components: { LeaderboardOpen },
        },
      } = layers;

      return merge(of(0), Name.update$).pipe(
        map(() => {
          const dir: number = 0;
          const speed: number = 0;

          const playerEntity = getPlayerEntity(activeNetwork().connectedAddress.get());
          const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;
          const openLeaderboard = () => setComponent(LeaderboardOpen, godIndex, { value: true });

          if (!name) return null;
          return {
            name,
            dir,
            speed,
            openLeaderboard,
          };
        })
      );
    },
    ({ name, dir, speed, openLeaderboard }) => {
      return (
        <TopBarContainer>
          <Compass direction={dir} speed={speed} />
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "8px" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}'s Log</span>
            <Button onClick={openLeaderboard} style={{ width: "40px", background: colors.thickGlass }}>
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
