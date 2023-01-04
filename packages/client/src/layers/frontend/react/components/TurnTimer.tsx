import { map, merge } from "rxjs";
import styled from "styled-components";
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

      let str = "";
      if (phase == Phase.Commit) str = `Move Phase`;
      else if (phase == Phase.Reveal) str = "Waiting for Players to Reveal Moves...";
      else if (phase == Phase.Action) str = `Action Phase`;

      return (
        <OuterContainer>
          <InternalContainer>
            <Text secsLeft={secsLeft}>{str} </Text>
            <ProgressBar phaseLength={phaseLength} secsLeft={secsLeft} />
          </InternalContainer>
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

const Text = styled.div<{ secsLeft: number }>`
  width: 100%;
  color: ${({ secsLeft }) => (secsLeft < 5 ? colors.white : colors.darkBrown)};
  line-height: 24px;
  text-align: center;
  z-index: 100;
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
