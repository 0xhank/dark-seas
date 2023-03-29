import { useObservableValue } from "@latticexyz/react";
import { getComponentValue } from "@latticexyz/recs";
import styled, { keyframes } from "styled-components";
import { useGame } from "../../../mud/providers/GameProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { Category } from "../../sound";
import { Phase } from "../../types";
import { formatTime } from "../../utils/directions";
import { colors } from "../styles/global";
import { Cell } from "./Cell";

const gridConfig = { gridRowStart: 1, gridRowEnd: 1, gridColumnStart: 5, gridColumnEnd: 9 };

export function TurnTimer() {
  const {
    network: { clock },
    utils: { getGameConfig, getPhase, secondsUntilNextPhase, getTurn },
    components: { LastAction },

    utils: { playSound },
    components: { EncodedCommitment },
    godEntity,
  } = useGame();

  const time = useObservableValue(clock.time$) || 0;
  const gameConfig = getGameConfig();
  if (!gameConfig) return null;

  const phase = getPhase(time);
  const turn = getTurn(time);
  const playerEntity = usePlayer();

  const secsLeft = secondsUntilNextPhase(time) || 0;

  const phaseLength =
    phase == Phase.Commit
      ? gameConfig.commitPhaseLength
      : phase == Phase.Reveal
      ? gameConfig.revealPhaseLength
      : gameConfig.actionPhaseLength;

  if (!playerEntity || !phaseLength) return null;

  if (secsLeft < 6 && !getComponentValue(EncodedCommitment, godEntity)) {
    playSound("tick", Category.UI);
  }
  let str = null;
  if (phase == Phase.Commit) {
    str = <Text secsLeft={secsLeft}>Choose your moves</Text>;
  } else if (phase == Phase.Reveal) str = <PulsingText>Waiting for Players to Reveal Moves...</PulsingText>;
  else if (phase == Phase.Action) {
    str = <Text secsLeft={secsLeft}>Choose 2 actions per ship</Text>;
    const lastAction = getComponentValue(LastAction, playerEntity)?.value;

    if (secsLeft < 6 && lastAction !== turn) {
      playSound("tick", Category.UI);
    }
  }
  const closeTime =
    Number(gameConfig.startTime) +
    gameConfig.entryCutoffTurns *
      (gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength);

  const timeUntilRound = closeTime - time / 1000;
  if (timeUntilRound == 0) playSound("success", Category.UI);
  const show = phase !== Phase.Reveal;
  return (
    <Cell style={{ ...gridConfig, display: "flex", alignItems: "flex-start", padding: "12px" }}>
      <OuterContainer>
        <InternalContainer hide={!show}>
          {str}
          {show && <ProgressBar phaseLength={phaseLength} secsLeft={secsLeft} />}
        </InternalContainer>
        {timeUntilRound > 0 && (
          <div style={{ opacity: "70%", fontStyle: "italic", fontSize: "1.5rem" }}>
            Cannons disabled until round start
          </div>
        )}
      </OuterContainer>
      {timeUntilRound > 0 && (
        <div
          style={{
            position: "fixed",
            right: 12,
            bottom: 12,
            fontSize: "3rem",
            color: colors.gold,
          }}
        >
          Round starts in {formatTime(timeUntilRound)}
        </div>
      )}
    </Cell>
  );
}

const OuterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  text-align: center;
  width: 100%;
`;

const InternalContainer = styled.div<{ hide?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ hide }) => (hide ? "transparent" : colors.glass)};
  border-radius: 6px;
  height: 40px;
  backdrop-filter: ${({ hide }) => (hide ? "none" : "blur(3px)")};
  width: 100%;
`;

const Text = styled.div<{ secsLeft?: number }>`
  width: 100%;
  color: ${({ secsLeft }) => (secsLeft && secsLeft > 5 ? colors.darkBrown : colors.white)};
  line-height: 24px;
  text-align: center;
  z-index: 100;
`;

const pulse = keyframes`
0% { 
  opacity: 0.5;
}
50% { 
  opacity: 1.0;
}
100% { 
  opacity: 0.5;
}
`;
const PulsingText = styled(Text)`
  animation-name: ${pulse};
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
`;

const ProgressBar = styled.div<{ phaseLength: number; secsLeft: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  transition: width 1s linear;
  background-color: ${({ secsLeft }) => (secsLeft > 5 ? colors.gold : colors.red)};
  width: ${({ phaseLength, secsLeft }) => `calc(100% * ${(phaseLength - secsLeft + 1) / phaseLength})`};
  border-radius: 6px;
`;
