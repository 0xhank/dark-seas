import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { Phase, PhaseNames } from "../../../../types";
import { getWindBoost } from "../../../../utils/directions";
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
        world,
        network: { clock },
        components: { Wind, Rotation },
        utils: { getGameConfig, getPhase },
      } = layers.network;

      const { SelectedShip } = layers.backend.components;

      return merge(clock.time$, Wind.update$, SelectedShip.update$).pipe(
        map(() => {
          const gameConfig = getGameConfig();
          if (!gameConfig) return;

          // add 5 seconds to give time to auto submit at end of phase
          // TODO: just use the backend functionality instead of duplicating logic
          const currentTime = Math.floor(clock.currentTime / 1000) + DELAY;
          const gameLength = currentTime - parseInt(gameConfig.startTime);
          const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
          const secondsIntoTurn = gameLength % turnLength;

          const phase = getPhase(DELAY);
          if (phase == undefined) return;

          const phaseStart =
            phase == Phase.Commit
              ? 0
              : phase == Phase.Reveal
              ? gameConfig.commitPhaseLength
              : gameConfig.commitPhaseLength + gameConfig.revealPhaseLength;

          const phaseLength =
            phase == Phase.Commit
              ? gameConfig.commitPhaseLength
              : phase == Phase.Reveal
              ? gameConfig.revealPhaseLength
              : gameConfig.actionPhaseLength;

          const phaseEnd = phaseStart + phaseLength - 1;

          const secondsUntilNextPhase = phaseEnd - secondsIntoTurn;

          return {
            phaseLength,
            secondsUntilNextPhase,
            phase,
            Wind,
            world,
            SelectedShip,
            Rotation,
          };
        })
      );
    },
    ({ phaseLength, secondsUntilNextPhase, phase, Wind, world, SelectedShip, Rotation }) => {
      if (!phaseLength) return null;
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value;
      const rotation = selectedShip ? getComponentValueStrict(Rotation, selectedShip as EntityIndex).value : undefined;
      const windBoost = rotation ? getWindBoost(wind, rotation) : 0;
      return (
        <OuterContainer>
          <InternalContainer>
            <Text secondsUntilNextPhase={secondsUntilNextPhase}>
              {secondsUntilNextPhase + 1} seconds left in {PhaseNames[phase]} phase
            </Text>
            <ProgressBar phaseLength={phaseLength} secondsUntilNextPhase={secondsUntilNextPhase} />
          </InternalContainer>
          {windBoost != 0 && (
            <span>
              The wind is {windBoost > 0 ? "speeding this ship by" : "slowing this ship by"} {Math.abs(windBoost)}
              kts!
            </span>
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

const Text = styled.div<{ secondsUntilNextPhase: number }>`
  width: 100%;
  color: ${({ secondsUntilNextPhase }) => (secondsUntilNextPhase < 5 ? colors.white : colors.darkBrown)};
  line-height: 24px;
  text-align: center;
  z-index: 100;
`;

const ProgressBar = styled.div<{ phaseLength: number; secondsUntilNextPhase: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 30px;
  transition: width 1s linear;
  background-color: ${({ secondsUntilNextPhase }) => (secondsUntilNextPhase < 5 ? colors.red : colors.gold)};
  width: ${({ phaseLength, secondsUntilNextPhase }) =>
    `calc(100% * ${(phaseLength - secondsUntilNextPhase) / phaseLength})`};
  border-radius: 6px;
`;
