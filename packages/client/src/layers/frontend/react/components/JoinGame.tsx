import { Has, runQuery, setComponent } from "@latticexyz/recs";
import { computedToStream } from "@latticexyz/utils";
import { utils, Wallet } from "ethers";
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
          components: { Player, OwnedBy },
          utils: { activeNetwork },
          ownerNetwork: { clock },
        },
        backend: {
          components: { ModalOpen },
          actions: { Action },
          api: { spawnPlayer },
          utils: { getTurn, getPlayerEntity, getGameConfig },
        },
      } = layers;

      return merge(
        computedToStream(activeNetwork().connectedAddress),
        clock.time$,
        Player.update$,
        OwnedBy.update$,
        Action.update$
      ).pipe(
        map(() => {
          const playerEntity = getPlayerEntity();
          if (playerEntity) return;
          const gameConfig = getGameConfig();
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
      const [useBurner, setUseBurner] = useState(false);
      const [burnerPrivateKey, setBurnerPrivateKey] = useState("");
      const invalidPrivateKey = useBurner && !utils.isHexString(burnerPrivateKey, 32);

      const findSpawnButtonDisabled = playerName.length === 0 || entryWindowClosed || invalidPrivateKey;

      const handleRandomize = () => {
        setBurnerPrivateKey(Wallet.createRandom().privateKey);
      };
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
            <Input type={"checkbox"} checked={useBurner} onChange={() => setUseBurner(!useBurner)} />
            <div style={{ display: useBurner ? "block" : "none" }}>
              <Input
                type={"text"}
                onChange={(e) => {
                  setBurnerPrivateKey(e.target.value);
                }}
                placeholder="create burner account"
                value={burnerPrivateKey}
              ></Input>
              <Input type="button" onClick={handleRandomize} />
            </div>
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
                  spawnPlayer(playerName, useBurner ? burnerPrivateKey : undefined);
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
