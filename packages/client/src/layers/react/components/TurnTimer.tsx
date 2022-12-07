import React from "react";
import { registerUIComponent } from "../engine";
import { map, merge } from "rxjs";
import { colors, Container } from "../styles/global";
import { Phase, PhaseNames } from "../../../constants";
import styled from "styled-components";
import {
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";
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
        components: { Wind, Rotation, OwnedBy },
        utils: { getGameConfig, getPhase },
      } = layers.network;

      const {
        components: { SelectedShip, Selection, SelectedMove, SelectedActions },
        scenes: {
          Main: { objectPool },
        },
        polygonRegistry,
      } = layers.phaser;

      return merge(clock.time$, Wind.update$, SelectedShip.update$).pipe(
        map(() => {
          const gameConfig = getGameConfig();
          if (!gameConfig) return;

          const gameLength = Math.floor(clock.currentTime / 1000) - parseInt(gameConfig.startTime);
          const turnLength = gameConfig.revealPhaseLength + gameConfig.commitPhaseLength + gameConfig.actionPhaseLength;
          const secondsIntoTurn = gameLength % turnLength;

          const phase = getPhase();
          if (phase == undefined) return;

          const phaseStart =
            phase == Phase.Commit
              ? 0
              : phase == Phase.Reveal
              ? gameConfig.commitPhaseLength
              : gameConfig.commitPhaseLength + gameConfig.revealPhaseLength;

          const phaseEnd =
            phase == Phase.Commit
              ? gameConfig.commitPhaseLength
              : phase == Phase.Reveal
              ? gameConfig.commitPhaseLength + gameConfig.revealPhaseLength
              : turnLength;

          const secondsUntilNextPhase = phaseEnd - secondsIntoTurn;

          const phaseLength = phaseEnd - phaseStart;

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
            OwnedBy,
            Selection,
            SelectedMove,
            SelectedActions,
            world,
            polygonRegistry,
            objectPool,
            getCurrentGamePhase,
            getPlayerEntity,
          };
        })
      );
    },
    ({
      phaseLength,
      secondsUntilNextPhase,
      phase,
      Wind,
      world,
      SelectedShip,
      SelectedMove,
      SelectedActions,
      Rotation,
      Selection,
      OwnedBy,
      polygonRegistry,
      objectPool,
      getPlayerEntity,
    }) => {
      if (!phaseLength) return null;
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);
      const playerEntity = getPlayerEntity();
      if (!playerEntity) return null;

      if (secondsUntilNextPhase == 0) {
        removeComponent(Selection, GodEntityIndex);

        if (phase !== Phase.Commit) {
          const yourShips = [...runQuery([HasValue(OwnedBy, { value: world.entities[playerEntity] })])];
          yourShips.map((ship) => {
            polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
            polygonRegistry.get(`activeGroup-${ship}`)?.clear(true, true);
            objectPool.remove(`projection-${ship}`);
            removeComponent(SelectedMove, ship);
            removeComponent(SelectedActions, ship);
          });
        }
      }

      const wind = getComponentValueStrict(Wind, GodEntityIndex);
      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value;
      const rotation = selectedShip ? getComponentValueStrict(Rotation, selectedShip as EntityIndex).value : undefined;
      const windBoost = rotation ? getWindBoost(wind, rotation) : 0;
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
