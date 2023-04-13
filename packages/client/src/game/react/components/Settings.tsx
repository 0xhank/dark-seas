import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useGame } from "../../../mud/providers/GameProvider";
import { Button, Img } from "../../../styles/global";
import { ModalType } from "../..//types";

export function Settings() {
  const {
    utils: { muteSfx, unmuteSfx, playMusic, muteMusic },
    components: { Volume, ModalOpen, Page },
    singletonEntity,
    gameEntity,
    world,
    worldAddress,
  } = useGame();

  const openLeaderboard = () => setComponent(ModalOpen, ModalType.LEADERBOARD, { value: true });
  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });

  const volume = useComponentValue(Volume, gameEntity, { value: 0 }).value;
  const musicVolume = useComponentValue(Volume, 1 as EntityIndex, { value: 0 }).value;
  return (
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
      <Button
        style={{ width: "40px", height: "40px" }}
        onClick={() => {
          world.dispose();
          setComponent(Page, singletonEntity, { page: "home", gameEntity: singletonEntity });
        }}
      >
        <Img src={"/icons/exit.svg"} />
      </Button>
    </SettingsContainer>
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
