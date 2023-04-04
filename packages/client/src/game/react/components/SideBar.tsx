import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, Has, HasValue, NotValue, runQuery } from "@latticexyz/recs";
import styled from "styled-components";
import { useGame } from "../../../mud/providers/GameProvider";
import { useOwner } from "../../../mud/providers/OwnerProvider";
import { colors } from "../../../styles/global";
import { world } from "../../../world";
import { ConfirmButtons } from "./ShipStatus/ConfirmButtons";
import { YourShip } from "./ShipStatus/YourShip";
const gridConfig = { gridRowStart: 1, gridRowEnd: 12, gridColumnStart: 1, gridColumnEnd: 12 };

export function SideBar() {
  const {
    components: { Name, Ship, OwnedBy, HealthLocal, SelectedShip },
    gameEntity,
  } = useGame();

  const ownerEntity = useOwner();
  const name = useComponentValue(Name, ownerEntity)?.value;
  useObservableValue(HealthLocal.update$);

  const aliveShips = [
    ...runQuery([
      Has(Ship),
      HasValue(OwnedBy, { value: world.entities[ownerEntity] }),
      NotValue(HealthLocal, { value: 0 }),
    ]),
  ];

  const selectedShip = useComponentValue(SelectedShip, gameEntity)?.value as EntityIndex | undefined;

  return (
    <TopBarContainer>
      <div style={{ flex: "1", display: "flex", flexDirection: "column", textAlign: "left", gap: "12px" }}>
        <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}</span>
      </div>
      <YourShips>
        <ConfirmButtons />

        <MoveButtons>
          {aliveShips.length == 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: colors.white, fontSize: "2rem" }}>You have no ships!</span>
            </div>
          ) : (
            aliveShips.map((shipEntity) => (
              <YourShip
                key={`shipEntity-${shipEntity}`}
                shipEntity={shipEntity}
                selected={selectedShip == shipEntity}
              />
            ))
          )}
        </MoveButtons>
      </YourShips>
    </TopBarContainer>
  );
}

const TopBarContainer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  padding: 12px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: white;
  justify-content: space-between;
`;

const YourShips = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 24px;
`;

const MoveButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-weight: 700;
  pointer-events: all;
  max-height: 80vh;
  flex-flow: column-reverse wrap;
`;
