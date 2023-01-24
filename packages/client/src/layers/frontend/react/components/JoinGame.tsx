import { EntityID, Has, hasComponent, runQuery } from "@latticexyz/recs";
import { computedToStream } from "@latticexyz/utils";
import { useState } from "react";
import { map, merge } from "rxjs";
import { Layers } from "../../../../types";
import { registerUIComponent } from "../engine";
import { Button, colors, Input } from "../styles/global";

const JoinGameContainer = ({ layers }: { layers: Layers }) => {
  const {
    backend: {
      world,
      api: { spawnPlayer },
      actions: { Action },
    },
  } = layers;

  const [playerName, setPlayerName] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  const findSpawnButtonDisabled = playerName.length === 0 || x == undefined || y == undefined;
  const spawnAction = [...runQuery([Has(Action)])].length > 0;
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
        {/* <div style={{ display: "flex", gap: "8px" }}>
          <Input
            style={{ flex: 2, textAlign: "center" }}
            type={"number"}
            placeholder="X..."
            value={x}
            onChange={(e) => {
              if (isNaN(Number(e.target.value))) return;
              if (e.target.value.length < 15) setX(e.target.value);
            }}
          ></Input>
          <Input
            style={{ flex: 2, textAlign: "center" }}
            type={"text"}
            placeholder="Y..."
            value={y}
            onChange={(e) => {
              if (isNaN(Number(e.target.value))) return;
              if (e.target.value.length < 15) setY(e.target.value);
            }}
          ></Input>
        </div> */}
        {!spawnAction ? (
          <Button
            isSelected
            disabled={findSpawnButtonDisabled}
            style={{
              fontSize: "1.5rem",
              flex: 1,
            }}
            onClick={() => {
              if (x == undefined || y == undefined) return;
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
      </div>
    </div>
  );
};

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
          network: { connectedAddress },
          components: { Player, OwnedBy },
          world,
        },
        backend: {
          actions: { Action },
        },
      } = layers;

      return merge(computedToStream(connectedAddress), Player.update$, OwnedBy.update$, Action.update$).pipe(
        map(() => connectedAddress.get()),
        map((address) => {
          if (!address) return;

          const playerEntity = world.entityToIndex.get(address as EntityID);

          if (playerEntity != undefined) {
            if (hasComponent(Player, playerEntity)) return;
          }
          return {
            layers,
            playerEntity,
          };
        })
      );
    },
    (props) => {
      return <JoinGameContainer {...props} />;
    }
  );
}
