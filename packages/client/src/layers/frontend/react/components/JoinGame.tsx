import { EntityID, Has, hasComponent, runQuery } from "@latticexyz/recs";
import { computedToStream } from "@latticexyz/utils";
import { utils, Wallet } from "ethers";
import { useState } from "react";
import { map, merge } from "rxjs";
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
          world,
        },
        backend: {
          actions: { Action },
          api: { spawnPlayer },
        },
      } = layers;

      return merge(
        computedToStream(activeNetwork().connectedAddress),
        Player.update$,
        OwnedBy.update$,
        Action.update$
      ).pipe(
        map(() => activeNetwork().connectedAddress.get()),
        map((address) => {
          if (!address) return;

          const playerEntity = world.entityToIndex.get(address as EntityID);

          if (playerEntity != undefined) {
            if (hasComponent(Player, playerEntity)) return;
          }

          const spawnAction = [...runQuery([Has(Action)])].length > 0;
          return {
            spawnAction,
            spawnPlayer,
          };
        })
      );
    },
    ({ spawnAction, spawnPlayer }) => {
      const [playerName, setPlayerName] = useState("");
      const [useBurner, setUseBurner] = useState(false);
      const [burnerPrivateKey, setBurnerPrivateKey] = useState("");

      const invalidPrivateKey = useBurner && !utils.isHexString(burnerPrivateKey, 32);
      const findSpawnButtonDisabled = playerName.length === 0 || invalidPrivateKey;

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
          </div>
        </div>
      );
    }
  );
}
