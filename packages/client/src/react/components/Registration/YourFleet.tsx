import { useComponentValue, useObservableValue } from "@latticexyz/react";
import {
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { merge } from "rxjs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { world } from "../../../mud/world";
import { formatTime } from "../../../utils/directions";
import { Button, colors, Container } from "../../styles/global";
import { ShipButton } from "./ShipButton";

export function YourFleet({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype, Name, StagedShips, ActiveShip },
    actions: { Action },
    utils: { decodeShipPrototype, getGameConfig },
    api: { spawnPlayer },
    network: { clock },
    godEntity,
  } = useMUD();

  useObservableValue(merge(ShipPrototype.update$, Action.update$));

  const budget = getGameConfig()?.budget || 0;
  const name = useComponentValue(Name, godEntity, { value: "" }).value;
  const stagedShips = useComponentValue(StagedShips, godEntity, { value: [] }).value.map((ship) => ({
    entity: ship as EntityIndex,
    ...decodeShipPrototype(ship as EntityIndex),
  }));

  const moneySpent = stagedShips.reduce((prev, curr) => prev + curr.price, 0);
  const spawnActions = [...runQuery([Has(Action)])];

  const spawning = !!spawnActions.find((action) => {
    const state = getComponentValueStrict(Action, action).state;
    return state !== ActionState.Complete && state !== ActionState.Failed;
  });
  const txFailed =
    !spawning &&
    !!spawnActions.find((action) => {
      const state = getComponentValueStrict(Action, action).state;
      return state == ActionState.Complete || state == ActionState.Failed;
    });

  const spawn = () => {
    if (stagedShips.length == 0 || name.length == 0) return;
    spawnPlayer(
      name,
      stagedShips.map((ship) => world.entities[ship.entity])
    );
  };

  const time = useObservableValue(clock.time$) || 0;
  const gameConfig = getGameConfig();
  const closeTime = !gameConfig
    ? 0
    : Number(gameConfig.startTime) +
      gameConfig.entryCutoffTurns *
        (gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength);

  const timeUntilRound = closeTime - time / 1000;
  const spawnDisabled = spawning || name.length == 0 || stagedShips.length == 0 || timeUntilRound < 0;
  const onClick = spawning || txFailed ? () => {} : spawn;
  const content = spawnDisabled ? (
    "Entry closed!"
  ) : spawning ? (
    "Spawning..."
  ) : txFailed ? (
    "Spawn failed! Try again."
  ) : (
    <div>
      <p style={{ fontSize: "1.5rem" }}>Register</p>
      <p>{formatTime(timeUntilRound)}</p>
    </div>
  );

  const background = txFailed ? colors.red : colors.gold;

  const removeShip = (index: number) => {
    const ships = getComponentValue(StagedShips, godEntity)?.value;
    if (!ships || index > ships.length) return;
    ships.splice(index, 1);
    setComponent(StagedShips, godEntity, { value: ships });
    removeComponent(ActiveShip, godEntity);
  };

  return (
    <Container style={{ flex }}>
      <Title>Your Fleet</Title>

      <ShipButtons>
        {stagedShips.map((ship, index) => (
          <ShipButton prototypeEntity={ship.entity}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeShip(index);
              }}
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <img
                src={"/icons/close.svg"}
                style={{
                  height: "14px",
                  width: "14px",
                  filter: "invert(14%) sepia(72%) saturate(7185%) hue-rotate(355deg) brightness(95%) contrast(119%)",
                }}
              />
            </button>
          </ShipButton>
        ))}
      </ShipButtons>
      <div style={{ display: "flex", gap: "6px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
            textAlign: "left",
            background: colors.lightTan,
            padding: "6px",
            borderRadius: "6px",
            minWidth: "70px",
            flex: 2,
          }}
        >
          <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>budget</p>
          <Title>
            {moneySpent} / {budget}
          </Title>
        </div>
        <Button
          disabled={spawnDisabled}
          onClick={onClick}
          style={{
            fontSize: "1.5rem",
            width: "100%",
            background: background,
            flex: 3,
            lineHeight: "1.75rem",
          }}
        >
          {content}
        </Button>
      </div>
    </Container>
  );
}

const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Title = styled.p`
  font-size: 2.5rem;
  line-height: 3rem;
  text-align: center;
`;
