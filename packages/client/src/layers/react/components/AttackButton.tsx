import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import { EntityIndex, getComponentEntities, getComponentValue, getComponentValueStrict } from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { GodID } from "@latticexyz/network";
import { Side } from "../../../constants";

export function registerAttackButton() {
  registerUIComponent(
    // name
    "AttackButton",
    // grid location
    {
      rowStart: 3,
      rowEnd: 4,
      colStart: 1,
      colEnd: 3,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          api: { attack },
        },
        phaser: {
          components: { SelectedShip },
        },
      } = layers;
      return merge(SelectedShip.update$).pipe(
        map(() => ({
          SelectedShip,
          world,
          attack,
        }))
      );
    },
    ({ SelectedShip, world, attack }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const shipEntity = getComponentValue(SelectedShip, GodEntityIndex);

      return (
        <div style={{ width: "100%", height: "100%", background: "brown", pointerEvents: "all" }}>
          <span>Attack with {shipEntity?.value || "N/A"}</span>
          <div style={{ display: "flex" }}>
            <button
              style={{
                width: "100%",
                height: "100%",
                textAlign: "center",
                padding: "5px",
                cursor: "pointer",
              }}
              disabled={!shipEntity}
              onClick={() => {
                if (!shipEntity) return;
                attack(world.entities[shipEntity.value], Side.Left);
              }}
            >
              LEFT
            </button>
            <button
              style={{
                width: "100%",
                height: "100%",
                textAlign: "center",
                padding: "5px",
                cursor: "pointer",
              }}
              disabled={!shipEntity}
              onClick={() => {
                if (!shipEntity) return;
                attack(world.entities[shipEntity.value], Side.Right);
              }}
            >
              RIGHT
            </button>
          </div>
        </div>
      );
    }
  );
}
