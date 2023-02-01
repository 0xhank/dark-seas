import { getComponentValue, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { ModalType } from "../../../../../types";
import { registerUIComponent } from "../../engine";
import { Button, colors, Img } from "../../styles/global";
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
          components: { ModalOpen },
        },
      } = layers;

      return merge(Name.update$, Booty.update$).pipe(
        map(() => {
          const playerEntity = getPlayerEntity(connectedAddress.get());
          if (!playerEntity) return;
          const booty = Number(getComponentValueStrict(Booty, playerEntity).value);
          const name = playerEntity ? getComponentValue(Name, playerEntity)?.value : undefined;
          const openLeaderboard = () => setComponent(ModalOpen, godEntity, { value: ModalType.LEADERBOARD });
          const openTutorial = () => setComponent(ModalOpen, godEntity, { value: ModalType.TUTORIAL });

          if (!name) return null;
          return {
            name,
            booty,
            openLeaderboard,
            openTutorial,
          };
        })
      );
    },
    ({ name, booty, openLeaderboard, openTutorial }) => {
      return (
        <TopBarContainer>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "12px" }}>
            <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}</span>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
              <ShipAttribute attributeType={ShipAttributeTypes.Booty} attribute={booty} />

              <Button onClick={openLeaderboard} style={{ width: "40px", background: colors.thickGlass }}>
                <Img src={"/icons/podium.svg"} />
              </Button>
              <Button onClick={openTutorial} style={{ width: "40px", background: colors.thickGlass }}>
                <Img src={"/icons/help.svg"} />
              </Button>
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
