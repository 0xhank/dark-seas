import { useObservableValue } from "@latticexyz/react";
import { getComponentValue } from "@latticexyz/recs";
import styled, { keyframes } from "styled-components";
import { useMUD } from "../../../../MUDContext";
import { Category } from "../../../../sound";
import { Phase } from "../../../../types";
import { DELAY } from "../../constants";
import { Cell } from "../engine/components";
import { colors } from "../styles/global";

const gridConfig = { gridRowStart: 1, gridRowEnd: 1, gridColumnStart: 5, gridColumnEnd: 9 };

export function TurnTimer() {
  const {
    network: { clock },
    utils: { getGameConfig, getPhase, secondsUntilNextPhase, getPlayerEntity, getTurn },
    components: { LastAction },

    utils: { playSound },
    components: { EncodedCommitment },
    godEntity,
  } = useMUD();

  const time = useObservableValue(clock.time$);
  const gameConfig = getGameConfig();
  if (!gameConfig) return null;

  const phase = getPhase(DELAY);
  const turn = getTurn(DELAY);
  const playerEntity = getPlayerEntity();

  const secsLeft = secondsUntilNextPhase(DELAY) || 0;

  const phaseLength =
    phase == Phase.Commit
      ? gameConfig.commitPhaseLength
      : phase == Phase.Reveal
      ? gameConfig.revealPhaseLength
      : gameConfig.actionPhaseLength;

  if (!playerEntity || !phaseLength) return null;

  let str = null;
  if (phase == Phase.Commit) {
    str = <Text secsLeft={secsLeft}>Choose your moves</Text>;
    if (secsLeft < 6 && !getComponentValue(EncodedCommitment, godEntity)) {
      playSound("tick", Category.UI);
    }
  } else if (phase == Phase.Reveal) str = <PulsingText>Waiting for Players to Reveal Moves...</PulsingText>;
  else if (phase == Phase.Action) {
    str = <Text secsLeft={secsLeft}>Choose 2 actions per ship</Text>;
    const lastAction = getComponentValue(LastAction, playerEntity)?.value;

    if (secsLeft < 6 && lastAction !== turn) {
      playSound("tick", Category.UI);
    }
  }

  return (
    <Cell style={gridConfig}>
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
    </Cell>
  );
}

const OuterContainer = styled.div`
  top: 12px;
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
  height: 40px;
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
