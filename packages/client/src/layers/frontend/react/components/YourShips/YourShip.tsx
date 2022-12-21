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
      components: { Position, Health, CrewCount },
      world,
    },
    backend: {
      components: { SelectedShip },
    },
    phaser: {
      scenes: {
        Main: { camera },
      },
      positions,
    },
  } = layers;

  const selectShip = (ship: EntityIndex, position: Coord) => {
    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);

    setComponent(SelectedShip, GodEntityIndex, { value: ship });
  };

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const position = getComponentValueStrict(Position, ship);
  const health = getComponentValueStrict(Health, ship).value;
  const crewCount = getComponentValueStrict(CrewCount, ship).value;
  const isSelected = selectedShip == ship;

  let selectionContent = null;
  if (crewCount == 0) {
    selectionContent = <SpecialText>This ship has no crew!</SpecialText>;
  } else if (health == 0) {
    selectionContent = <SpecialText>This ship is sunk!</SpecialText>;
  } else if (phase == Phase.Commit) {
    selectionContent = <MoveSelection ship={ship} layers={layers} />;
  } else if (phase == Phase.Action) {
    selectionContent = <ActionSelection ship={ship} layers={layers} />;
  }
  return (
    <YourShipContainer
      onClick={() => health !== 0 && crewCount !== 0 && selectShip(ship, position)}
      isSelected={isSelected}
      key={`move-selection-${ship}`}
    >
      <ShipCard layers={layers} ship={ship} />
      <MoveButtons>{selectionContent}</MoveButtons>
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
  height: 8rem;

  @media (max-width: 1310px) {
    height: 6rem;
  }

  @media (max-width: 1000px) {
    height: 4rem;
  }
`;

const YourShipContainer = styled(InternalContainer)`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  flex: 1;
  height: auto;
  cursor: pointer;
  box-shadow: ${({ isSelected }) => `inset 0px 0px 0px ${isSelected ? "5px" : "0px"} ${colors.gold}`};
  background: ${({ isSelected }) => `${isSelected ? colors.thickGlass : colors.glass}`};

  :hover {
    background: ${colors.thickGlass};
  }
`;

const SpecialText = styled.span`
  font-size: 2rem;
`;
