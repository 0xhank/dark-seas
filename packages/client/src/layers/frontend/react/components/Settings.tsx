import { EntityIndex, getComponentValue, setComponent } from "@latticexyz/recs";
import { map, merge, of } from "rxjs";
import styled from "styled-components";
import { ModalType } from "../../../../types";
import { registerUIComponent } from "../engine";
import { Button, Img } from "../styles/global";

export function registerSettings() {
  registerUIComponent(
    // name
    "Settings",
    // grid location
    {
      gridRowStart: 1,
      gridRowEnd: 3,
      gridColumnStart: 1,
      gridColumnEnd: 5,
    },
    // requirement
    (layers) => {
      const {
        backend: {
          utils: { muteSfx, unmuteSfx, playMusic, muteMusic },
        },
        phaser: {
          components: { Volume, ModalOpen },
          godEntity,
        },
      } = layers;

      return merge(of(0), Volume.update$).pipe(
        map(() => {
          const openLeaderboard = () => setComponent(ModalOpen, ModalType.LEADERBOARD, { value: true });
          const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });

          const volume = getComponentValue(Volume, godEntity)?.value || 0;
          const musicVolume = getComponentValue(Volume, 1 as EntityIndex)?.value || 0;
          return { volume, musicVolume, muteSfx, unmuteSfx, playMusic, muteMusic, openLeaderboard, openTutorial };
        })
      );
    },
    ({ volume, musicVolume, muteSfx, unmuteSfx, playMusic, muteMusic, openLeaderboard, openTutorial }) => (
      <SettingsContainer>
        <Button onClick={openLeaderboard} style={{ width: "40px" }}>
          <Img src={"/icons/podium.svg"} />
        </Button>
        <Button onClick={volume ? muteSfx : unmuteSfx} style={{ width: "40px", height: "40px" }}>
          <Img src={volume ? "/icons/unmute.svg" : "/icons/mute.svg"}></Img>
        </Button>
        <Button onClick={() => (musicVolume ? muteMusic() : playMusic(1))} style={{ width: "40px", height: "40px" }}>
          <Img src={musicVolume ? "/icons/unmute-music.svg" : "/icons/mute-music.svg"}></Img>
        </Button>

        <Button onClick={openTutorial} style={{ width: "40px" }}>
          <Img src={"/icons/help.svg"} />
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
  z-index: 499;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
