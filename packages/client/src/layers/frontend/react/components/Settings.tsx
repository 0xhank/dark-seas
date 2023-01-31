import { EntityIndex, getComponentValue } from "@latticexyz/recs";
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
          utils: { muteSfx, unmuteSfx, playMusic, muteMusic, playSound },
        },
        phaser: {
          components: { Volume },
          godEntity,
        },
      } = layers;

      return merge(of(0), Volume.update$).pipe(
        map(() => {
          const volume = getComponentValue(Volume, godEntity)?.value || 0;
          const musicVolume = getComponentValue(Volume, 1 as EntityIndex)?.value || 0;
          return { volume, musicVolume, muteSfx, unmuteSfx, playMusic, muteMusic };
        })
      );
    },
    ({ volume, musicVolume, muteSfx, unmuteSfx, playMusic, muteMusic }) => (
      <SettingsContainer>
        <Button onClick={volume ? muteSfx : unmuteSfx} style={{ width: "40px", height: "40px" }}>
          <Img src={volume ? "/icons/mute.svg" : "/icons/unmute.svg"}></Img>
        </Button>
        <Button onClick={() => (musicVolume ? muteMusic() : playMusic(1))} style={{ width: "40px", height: "40px" }}>
          <Img src={musicVolume ? "/icons/mute-music.svg" : "/icons/unmute-music.svg"}></Img>
        </Button>
      </SettingsContainer>
    )
  );
}

const SettingsContainer = styled.div`
  position: fixed;
  right: 12;
  top: 12;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
