import React from "react";
import { registerUIComponent } from "../engine";
import { map } from "rxjs";
import { colors, Container } from "../styles/global";
import { Phase, PhaseNames } from "../../../constants";
import { autoAction } from "mobx/dist/internal";
import styled from "styled-components";

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
        network: { clock, connectedAddress },
        components: {},
        utils: { getGameConfig },
      } = layers.network;

      return clock.time$.pipe(
        map((time) => {
          const gameConfig = getGameConfig();
          if (!gameConfig) return;

          const timeElapsed = Math.floor(time / 1000) - parseInt(gameConfig.startTime);
          const turnLength = gameConfig.movePhaseLength + gameConfig.actionPhaseLength;

          const secondsUntilNextTurn = turnLength - (timeElapsed % turnLength);

          const phase = secondsUntilNextTurn > gameConfig.actionPhaseLength ? Phase.Move : Phase.Action;

          const secondsUntilNextPhase =
            secondsUntilNextTurn > gameConfig.actionPhaseLength
              ? secondsUntilNextTurn - gameConfig.actionPhaseLength
              : secondsUntilNextTurn;

          const phaseLength = phase == Phase.Move ? gameConfig.movePhaseLength : gameConfig.actionPhaseLength;
          const address = connectedAddress.get();
          if (!address) return;

          return {
            layers,
            phaseLength,
            secondsUntilNextPhase,
            address,
            phase,
          };
        })
      );
    },
    ({ phaseLength, secondsUntilNextPhase, phase }) => {
      console.log("turn length:", phaseLength);
      if (!phaseLength) return null;

      return (
        <Container>
          <InternalContainer>
            <Text>
              {secondsUntilNextPhase} seconds left in {PhaseNames[phase]} Phase
            </Text>

            <ProgressBar phaseLength={phaseLength} secondsUntilNextPhase={secondsUntilNextPhase} />
          </InternalContainer>
        </Container>
      );
    }
  );
}

const InternalContainer = styled.div`
  width: 100%;
  background: ${colors.glass};
  border-radius: 6px;
  height: 30px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Text = styled.div`
  width: 100%;
  color: ${colors.darkBrown};
  line-height: 24px;
  text-align: center;
  z-index: 100;
`;

const ProgressBar = styled.div<{ phaseLength: number; secondsUntilNextPhase: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 1s linear;
  background-color: ${colors.gold};
  width: ${({ phaseLength, secondsUntilNextPhase }) =>
    `calc(100% * ${(phaseLength - secondsUntilNextPhase) / (phaseLength - 1)})`};
  border-radius: 6px;
`;
