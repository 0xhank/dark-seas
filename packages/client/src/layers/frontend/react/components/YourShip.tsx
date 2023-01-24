import {
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import color from "color";
import styled from "styled-components";
import { Layers, Phase } from "../../../../types";
import { getColorStr } from "../../../../utils/procgen";
import { colors, InternalContainer } from "../styles/global";
import { ActionSelection } from "./OverviewComponents/ActionSelection";
import { MoveSelection } from "./OverviewComponents/MoveSelection";
import { ShipCard } from "./OverviewComponents/ShipCard";

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
      components: { Position },
    },
    backend: {
      components: { SelectedShip, HoveredShip, HealthLocal },
      godIndex,
    },
    phaser: {
      scenes: {
        Main: { camera, positions },
      },
    },
  } = layers;

  const selectShip = (ship: EntityIndex, position: Coord) => {
    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);

    setComponent(SelectedShip, godIndex, { value: ship });
  };

  const position = getComponentValueStrict(Position, ship);
  const health = getComponentValue(HealthLocal, ship)?.value;
  const hoveredShip = getComponentValue(HoveredShip, godIndex)?.value;
  const isSelected = selectedShip == ship;
  const isHovered = hoveredShip == ship;
  const shipColor = getColorStr(ship);

  let selectionContent = null;

  if (health == 0) {
    selectionContent = <SpecialText>This ship is sunk!</SpecialText>;
  } else if (phase == Phase.Commit) {
    selectionContent = <MoveSelection ship={ship} layers={layers} />;
  } else if (phase == Phase.Action) {
    selectionContent = <ActionSelection ship={ship} layers={layers} />;
  }
  return (
    <YourShipContainer
      onClick={() => health !== 0 && selectShip(ship, position)}
      onMouseEnter={() => setComponent(HoveredShip, godIndex, { value: ship })}
      onMouseLeave={() => removeComponent(HoveredShip, godIndex)}
      isSelected={isSelected}
      isHovered={isHovered}
      shipColor={shipColor}
      key={`move-selection-${ship}`}
    >
      <ShipCard layers={layers} ship={ship} />
      <MoveButtons>{selectionContent}</MoveButtons>
    </YourShipContainer>
  );
};

const MoveButtons = styled.div`
  display: flex;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  min-width: 100%;
  justify-content: center;
  height: 8rem;
  overflow-x: overlay;
  overflow-y: hidden;
  ::-webkit-scrollbar {
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const YourShipContainer = styled(InternalContainer)<{
  shipColor: string;
  isSelected?: boolean;
  isHovered?: boolean;
  noGoldBorder?: boolean;
}>`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  flex: 1;
  height: auto;
  cursor: pointer;
  box-shadow: ${({ isSelected, shipColor }) => `inset 0px 0px 0px ${isSelected ? "5px" : "0px"} ${colors.white}`};
  background: ${({ isSelected, isHovered, shipColor }) =>
    `${color(shipColor)
      .lighten(0.1)
      .alpha(isSelected || isHovered ? 0.8 : 0.7)}`};
  padding-bottom: 5px;
`;

const SpecialText = styled.span`
  font-size: 1.5rem;
  align-text: center;
`;
