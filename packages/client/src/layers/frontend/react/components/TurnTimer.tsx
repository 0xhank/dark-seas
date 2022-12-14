import { map, merge } from "rxjs";
import styled, { keyframes } from "styled-components";
import { Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { registerUIComponent } from "../engine";
import { colors } from "../styles/global";

export function registerTurnTimer() {
  registerUIComponent(
    "TurnTimer",
    {
      rowStart: 1,
      rowEnd: 1,
      colStart: 6,
      colEnd: 9,
    },
    (layers) => {
      const {
        network: { clock },
        utils: { getGameConfig, getPhase, secondsUntilNextPhase },
      } = layers.network;

      return merge(clock.time$).pipe(
        map(() => {
          const gameConfig = getGameConfig();
          if (!gameConfig) return;

          const phase = getPhase(DELAY);
          const secsLeft = secondsUntilNextPhase(DELAY) || 0;

          const phaseLength =
            phase == Phase.Commit
              ? gameConfig.commitPhaseLength
              : phase == Phase.Reveal
              ? gameConfig.revealPhaseLength
              : gameConfig.actionPhaseLength;

          return {
            phaseLength,
            secsLeft,
            phase,
          };
        })
      );
    },
    ({ phaseLength, secsLeft, phase }) => {
      if (!phaseLength) return null;

      let str = null;
      if (phase == Phase.Commit) str = <Text secsLeft={secsLeft}>Choose your moves</Text>;
      else if (phase == Phase.Reveal) str = <PulsingText>Waiting for Players to Reveal Moves...</PulsingText>;
      else if (phase == Phase.Action) str = <Text secsLeft={secsLeft}>Choose 2 actions per ship</Text>;

      return (
        <OuterContainer>
          {phase == Phase.Commit || phase == Phase.Action ? (
            <InternalContainer>
              {str}
              <ProgressBar phaseLength={phaseLength} secsLeft={secsLeft} />
            </InternalContainer>
          ) : (
            str
          )}
        </OuterContainer>
      );
    }
  );
}

const OuterContainer = styled.div`
  top: 20px;
  left: 50%;
  transform: translate(-50%, 0);

  position: relative;
  text-align: center;
`;

const InternalContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${colors.glass};
  border-radius: 6px;
  height: 30px;
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
  height: 30px;
  transition: width 1s linear;
  background-color: ${({ secsLeft }) => (secsLeft < 5 ? colors.red : colors.gold)};
  width: ${({ phaseLength, secsLeft }) => `calc(100% * ${(phaseLength - secsLeft) / phaseLength})`};
  border-radius: 6px;
`;
