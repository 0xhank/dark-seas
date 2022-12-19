import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import styled from "styled-components";
import { Layers, Phase } from "../../../../../types";
import { colors, InternalContainer } from "../../styles/global";
import { ActionSelection } from "../OverviewComponents/ActionSelection";
import { MoveSelection } from "../OverviewComponents/MoveSelection";
import { ShipCard } from "./ShipCard";

export const YourShip = ({
  layers,
  ship,
  selectedShip,
  phase,
}: {
  layers: Layers;
  ship: EntityIndex;
  selectedShip: EntityIndex | undefined;
  phase: Phase;
}) => {
  const {
    network: {
      components: { Position, Health },
      world,
    },
    backend: {
      components: { SelectedShip },
    },
  } = layers;

  const selectShip = (ship: EntityIndex, position: Coord) => {
    setComponent(SelectedShip, GodEntityIndex, { value: ship });
  };

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const position = getComponentValueStrict(Position, ship);
  const health = getComponentValueStrict(Health, ship).value;
  const isSelected = selectedShip == ship;

  return (
    <YourShipContainer
      onClick={() => health !== 0 && selectShip(ship, position)}
      isSelected={isSelected}
      key={`move-selection-${ship}`}
    >
      <ShipCard layers={layers} ship={ship} />
      <MoveButtons>
        {phase == Phase.Commit ? (
          <MoveSelection ship={ship} layers={layers} />
        ) : phase == Phase.Action ? (
          <ActionSelection ship={ship} layers={layers} />
        ) : (
          "Executing Move"
        )}
      </MoveButtons>
    </YourShipContainer>
  );
};

const MoveButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  width: auto;
  height: 100px;
`;

const YourShipContainer = styled(InternalContainer)`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 150px;
  flex: 1;
  height: auto;
  cursor: pointer;
  box-shadow: ${({ isSelected }) => `inset 0px 0px 0px ${isSelected ? "5px" : "0px"} ${colors.gold}`};
  background: ${({ isSelected }) => `${isSelected ? colors.thickGlass : colors.glass}`};

  :hover {
    background: ${colors.thickGlass};
  }
`;
