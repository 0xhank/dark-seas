import { Has, runQuery } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { registerUIComponent } from "../engine";

type ShipData = {
  location: Coord;
  1: number;
  2: number;
  3: number;
};

export function registerDamageChance() {
  registerUIComponent(
    "DamageChance",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          components: { Cannon },
        },
        backend: {
          components: { HoveredAction },
          utils: { getTargetedShips, getDamageLikelihood, getPlayerShips },
          godIndex,
        },
        phaser: {
          scenes: {
            Main: { phaserScene, camera },
          },
          utils: { getSpriteObject },
        },
      } = layers;

      return merge(HoveredAction.update$, camera.worldView$, camera.zoom$).pipe(
        map(() => {
          // const hoveredAction = getComponentValue(HoveredAction, godIndex);

          // if (!hoveredAction) return;
          // const cannonEntity = hoveredAction.specialEntity as EntityIndex;

          // if (!cannonEntity) return;

          const playerShips = getPlayerShips();

          if (!playerShips) return;
          // const data = getTargetedShips(hoveredAction.specialEntity as EntityIndex).reduce((curr: ShipData[], ship) => {
          const data = playerShips.reduce((curr: ShipData[], ship) => {
            const shipObject = getSpriteObject(ship);

            console.log("ship position:", shipObject.x, shipObject.y);

            const cam = camera.phaserCamera;

            console.log("ship location: ", shipObject.x, shipObject.y);
            console.log("camera scroll:", cam.worldView);

            const x = Math.round(((shipObject.x - cam.worldView.x) * cam.zoom) / 2);
            const y = Math.round(((shipObject.y - cam.worldView.y) * cam.zoom) / 2);

            const location = { x, y };
            console.log(`location: ${location.x}, ${location.y}`);

            const cannon = [...runQuery([Has(Cannon)])][0];
            const hitChances = getDamageLikelihood(cannon, ship);
            if (!hitChances) return curr;
            return [...curr, { location, ...hitChances }];
          }, []);

          return {
            data,
          };
        })
      );
    },
    ({ data }) => {
      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {data.map((ship) => {
            return (
              <DamageContainer
                top={ship.location.y}
                left={ship.location.x}
                key={`ship-${ship.location.x}-${ship.location.y}`}
              >
                <span>Chance of damage</span>
                <span>1: {ship[1]}</span>
                <span>2: {ship[2]}</span>
                <span>3: {ship[3]}</span>
              </DamageContainer>
            );
          })}
        </div>
      );
    }
  );
}

const DamageContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  width: 100px;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  background: red;
  display: flex;
  flex-direction: column;
`;
