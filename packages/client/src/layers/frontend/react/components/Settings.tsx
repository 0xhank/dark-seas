import { getComponentValue } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../engine";
import { Button, Img } from "../styles/global";

export function registerSettings() {
  registerUIComponent(
    // name
    "Settings",
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
        backend: {
          utils: { muteSfx, unmuteSfx, playSound },
        },
        phaser: {
          components: { Volume },
          godEntity,
        },
      } = layers;

      return merge(of(0), Volume.update$).pipe(
        map(() => {
          const volume = getComponentValue(Volume, godEntity)?.value;
          if (volume == undefined) return;
          return { volume, muteSfx, unmuteSfx, playSound };
        })
      );
    },
    ({ volume, muteSfx, unmuteSfx, playSound }) => (
      <SettingsContainer>
        <Button onClick={volume ? muteSfx : unmuteSfx} style={{ width: "40px", height: "40px" }}>
          <Img src={volume ? "/icons/mute.svg" : "/icons/unmute.svg"}></Img>
        </Button>
      </SettingsContainer>
    )
  );
}

const SettingsContainer = styled.div`
  position: fixed;
  right: 20;
  top: 20;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
