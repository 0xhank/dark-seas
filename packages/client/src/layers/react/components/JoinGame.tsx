import React, { useState } from "react";
import { EntityID, EntityIndex, getComponentValue, Has, hasComponent, HasValue, Not, runQuery } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { computedToStream } from "@latticexyz/utils";
import { Layers } from "../../../types";
import { Button, colors, Input, Row } from "../styles/global";
import { registerUIComponent } from "../engine";

const JoinGameContainer = ({ layers }: { layers: Layers }) => {
  const {
    network: {
      world,
      components: { Player, Name },
      api: { spawnPlayer },
      utils: { getGameConfig },
    },
  } = layers;

  const [playerName, setPlayerName] = useState("");

  const findSpawnButtonDisabled = playerName.length === 0;

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
      <h1 style={{ fontSize: "2.5em", margin: "auto" }}>Name Your Captain</h1>

      <div
        style={{
          height: "100%",
          color: "#d07e1a",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        <Row>
          <Input
            style={{ flex: 2, textAlign: "center" }}
            type={"text"}
            placeholder="Name..."
            value={playerName}
            onChange={(e) => {
              if (e.target.value.length < 15) setPlayerName(e.target.value);
            }}
          ></Input>
          <Button
            isSelected
            disabled={findSpawnButtonDisabled}
            style={{
              fontSize: "1.5em",
              flex: 1,
            }}
            onClick={() => {
              spawnPlayer(playerName);
            }}
          >
            Register
          </Button>
        </Row>
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
      } = layers;

      return merge(computedToStream(connectedAddress), Player.update$, OwnedBy.update$).pipe(
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
