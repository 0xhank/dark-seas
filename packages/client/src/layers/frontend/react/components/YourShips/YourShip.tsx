import { GodID } from "@latticexyz/network";
import {
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
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
      components: { SelectedShip, HoveredShip },
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
  const hoveredShip = getComponentValue(HoveredShip, GodEntityIndex)?.value;
  const isSelected = selectedShip == ship;
  const isHovered = hoveredShip == ship;

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
      onMouseEnter={() => setComponent(HoveredShip, GodEntityIndex, { value: ship })}
      onMouseLeave={() => removeComponent(HoveredShip, GodEntityIndex)}
      isSelected={isSelected}
      isHovered={isHovered}
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
  overflow-x: unset;
  overflow-y: hidden;
`;

const YourShipContainer = styled(InternalContainer)<{
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
  box-shadow: ${({ isSelected }) => `inset 0px 0px 0px ${isSelected ? "5px" : "0px"} ${colors.gold}`};
  background: ${({ isSelected, isHovered }) => `${isSelected || isHovered ? colors.thickGlass : colors.glass}`};
`;

const SpecialText = styled.span`
  font-size: 2rem;
`;
