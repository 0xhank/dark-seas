import React from "react";
import { registerUIComponent } from "../engine";
import { map, merge } from "rxjs";
import { colors, Container } from "../styles/global";
import { Phase, PhaseNames } from "../../../constants";
import { autoAction } from "mobx/dist/internal";
import styled from "styled-components";
import { EntityIndex, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { GodID } from "@latticexyz/network";
import { getWindBoost } from "../../../utils/directions";

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
        network: { clock, connectedAddress },
        components: { Wind, Rotation },
        utils: { getGameConfig },
      } = layers.network;

      const {
        components: { SelectedShip },
      } = layers.phaser;

      return merge(clock.time$, Wind.update$, SelectedShip.update$).pipe(
        map(() => {
          const gameConfig = getGameConfig();
          if (!gameConfig) return;

          const timeElapsed = Math.floor(clock.currentTime / 1000) - parseInt(gameConfig.startTime);
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
            Wind,
            SelectedShip,
            Rotation,
            world,
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
      const windBoost = rotation ? getWindBoost(wind.speed, wind.direction, rotation) : 0;
      return (
        <OuterContainer>
          <InternalContainer>
            <Text>
              {secondsUntilNextPhase} seconds left in {PhaseNames[phase]} Phase
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
  height: 30px;
  transition: width 1s linear;
  background-color: ${colors.gold};
  width: ${({ phaseLength, secondsUntilNextPhase }) =>
    `calc(100% * ${(phaseLength - secondsUntilNextPhase) / (phaseLength - 1)})`};
  border-radius: 6px;
`;
