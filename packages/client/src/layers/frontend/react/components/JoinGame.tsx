import { getComponentValue, Has, runQuery, setComponent } from "@latticexyz/recs";
import { computedToStream } from "@latticexyz/utils";
import { useState } from "react";
import { map, merge } from "rxjs";
import { ModalType } from "../../../../types";
import { registerUIComponent } from "../engine";
import { Button, colors, Input } from "../styles/global";

export function registerJoinGame() {
  registerUIComponent(
    "JoinGameWindow",
    {
      colStart: 5,
      colEnd: 9,
      rowStart: 4,
      rowEnd: 9,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress, clock },
          components: { Player, OwnedBy, GameConfig },
          world,
        },
        backend: {
          components: { ModalOpen },
          actions: { Action },
          api: { spawnPlayer },
          utils: { getPlayerEntity, getTurn },
          godEntity,
        },
      } = layers;

      return merge(
        clock.time$,
        computedToStream(connectedAddress),
        Player.update$,
        OwnedBy.update$,
        Action.update$
      ).pipe(
        map(() => {
          const playerEntity = getPlayerEntity();
          if (playerEntity) return;
          const gameConfig = getComponentValue(GameConfig, godEntity);
          if (!gameConfig) return;

          const spawnAction = [...runQuery([Has(Action)])].length > 0;

          const turn = getTurn() || 0;
          const entryWindowClosed = turn > gameConfig.entryCutoffTurns;

          const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });
          return {
            spawnAction,
            spawnPlayer,
            entryWindowClosed,
            openTutorial,
          };
        })
      );
    },
    ({ spawnAction, spawnPlayer, entryWindowClosed, openTutorial }) => {
      const [playerName, setPlayerName] = useState("");
      const findSpawnButtonDisabled = playerName.length === 0 || entryWindowClosed;

      return (
        <div
          style={{
            background: colors.glass,
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
            {entryWindowClosed && (
              <h1 style={{ color: colors.red, textAlign: "center" }}>Registration window closed!</h1>
            )}
            {!spawnAction ? (
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
            ) : (
              <Button
                disabled
                style={{
                  fontSize: "1.5rem",
                  flex: 1,
                }}
              >
                Spawning...
              </Button>
            )}
            <Button onClick={openTutorial}>How to Play</Button>
          </div>
        </div>
      );
    }
  );
}
