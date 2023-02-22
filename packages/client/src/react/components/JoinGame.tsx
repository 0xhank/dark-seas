import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { getComponentValueStrict, Has, runQuery, setComponent } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { useState } from "react";
import { useMUD } from "../../mud/providers/MUDProvider";
import { ModalType } from "../../types";
import { Button, colors, Input } from "../styles/global";
import { Cell } from "./Cell";

const gridConfig = { gridColumnStart: 5, gridColumnEnd: 9, gridRowStart: 4, gridRowEnd: 9 };
export function JoinGame() {
  const {
    components: { GameConfig, ModalOpen },
    actions: { Action },
    api: { spawnPlayer },
    utils: { getTurn },
    godEntity,
    network: { clock },
  } = useMUD();

  const [playerName, setPlayerName] = useState("");

  const gameConfig = useComponentValue(GameConfig, godEntity);
  const time = useObservableValue(clock.time$) || 0;
  useObservableValue(Action.update$);
  if (!gameConfig) return null;

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

  const turn = getTurn(time) || 0;
  const entryWindowClosed = turn > gameConfig.entryCutoffTurns;

  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });

  const findSpawnButtonDisabled = playerName.length === 0 || entryWindowClosed;

  let content = (
    <Button
      isSelected
      disabled={findSpawnButtonDisabled}
      style={{
        fontSize: "1.5rem",
        flex: 1,
      }}
      onClick={() => {
        spawnPlayer(playerName);
      }}
    >
      Register
    </Button>
  );
  if (spawning) {
    content = (
      <Button
        disabled
        style={{
          fontSize: "1.5rem",
          flex: 1,
        }}
      >
        Spawning...
      </Button>
    );
  } else if (txFailed) {
    content = (
      <Button
        disabled={findSpawnButtonDisabled}
        onClick={() => {
          spawnPlayer(playerName);
        }}
        style={{
          fontSize: "1.5rem",
          flex: 1,
          background: colors.red,
        }}
      >
        Spawn failed! Try again.
      </Button>
    );
  }

  return (
    <Cell style={gridConfig}>
      <div
        style={{
          background: colors.glass,
          backdropFilter: "blur(3px)",
          color: colors.darkBrown,
          display: "flex",
          flexDirection: "column",
          pointerEvents: "all",
          borderRadius: "6px",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", margin: "auto" }}>Name Your Captain</h1>

        <div
          style={{
            height: "100%",
            color: "#d07e1a",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            gap: "12px",
          }}
        >
          <Input
            style={{ flex: 2, textAlign: "center" }}
            type={"text"}
            placeholder="Name..."
            value={playerName}
            onChange={(e) => {
              if (e.target.value.length < 15) setPlayerName(e.target.value);
            }}
          ></Input>
          {entryWindowClosed && <h1 style={{ color: colors.red, textAlign: "center" }}>Registration window closed!</h1>}
          {content}

          <Button onClick={openTutorial}>How to Play</Button>
        </div>
      </div>
    </Cell>
  );
}
