import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, removeComponent, setComponent } from "@latticexyz/recs";
import color from "color";
import styled from "styled-components";
import { useMUD } from "../../../MUDContext";
import { Phase } from "../../../types";
import { colors, InternalContainer } from "../../styles/global";
import { ActionSelection } from "./ActionSelection";
import { MoveSelection } from "./MoveSelection";
import { ShipCard } from "./ShipCard";

export const YourShip = ({
  shipEntity,
  selectedShip,
  phase,
}: {
  shipEntity: EntityIndex;
  selectedShip: EntityIndex | undefined;
  phase: Phase | undefined;
}) => {
  const {
    components: { SelectedShip, HoveredShip, HealthLocal },
    godEntity,
    scene: { camera },
    utils: { getSpriteObject },
  } = useMUD();

  const selectShip = (shipEntity: EntityIndex) => {
    const shipObject = getSpriteObject(shipEntity);

    camera.centerOn(shipObject.x, shipObject.y + 400);

    setComponent(SelectedShip, godEntity, { value: shipEntity });
  };
  const health = useComponentValue(HealthLocal, shipEntity)?.value;
  const hoveredShip = useComponentValue(HoveredShip, godEntity)?.value;
  const isSelected = selectedShip == shipEntity;
  const isHovered = hoveredShip == shipEntity;

  let selectionContent = null;

  if (health == 0) {
    selectionContent = <SpecialText>This shipEntity is sunk!</SpecialText>;
  } else if (phase == Phase.Commit) {
    selectionContent = <MoveSelection shipEntity={shipEntity} />;
  } else if (phase == Phase.Action) {
    selectionContent = <ActionSelection shipEntity={shipEntity} />;
  }
  return (
    <YourShipContainer
      onClick={() => selectShip(shipEntity)}
      onMouseEnter={() => setComponent(HoveredShip, godEntity, { value: shipEntity })}
      onMouseLeave={() => removeComponent(HoveredShip, godEntity)}
      isSelected={isSelected}
      isHovered={isHovered}
      key={`move-selection-${shipEntity}`}
    >
      <ShipCard shipEntity={shipEntity} />
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
  isSelected?: boolean;
  isHovered?: boolean;
  noGoldBorder?: boolean;
}>`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  flex: 1;
  cursor: pointer;
  box-shadow: ${({ isSelected }) => `inset 0px 0px 0px ${isSelected ? "5px" : "0px"} ${colors.white}`};
  background: ${({ isSelected, isHovered }) =>
    `${color(colors.white)
      .lighten(0.1)
      .alpha(isSelected || isHovered ? 0.8 : 0.7)}`};
  padding-bottom: 5px;
  min-width: 500px;
`;

const SpecialText = styled.span`
  font-size: 1.5rem;
  align-text: center;
`;
