import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, removeComponent, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { ShipContainer } from "../../styles/global";
import { ActionStatus } from "./ActionStatus";
import { ShipCard } from "./ShipCard";

export const YourShip = ({ shipEntity, selected }: { shipEntity: EntityIndex; selected: boolean }) => {
  const {
    components: { SelectedShip, HoveredShip },
    godEntity,
    scene: { camera },
    utils: { getSpriteObject },
  } = useMUD();

  const selectShip = (shipEntity: EntityIndex) => {
    const shipObject = getSpriteObject(shipEntity);

    camera.centerOn(shipObject.x, shipObject.y + 400);

    setComponent(SelectedShip, godEntity, { value: shipEntity });
  };
  const hoveredShip = useComponentValue(HoveredShip, godEntity)?.value;
  const isHovered = hoveredShip == shipEntity;

  return (
    <ShipContainer
      onClick={() => selectShip(shipEntity)}
      onMouseEnter={() => setComponent(HoveredShip, godEntity, { value: shipEntity })}
      onMouseLeave={() => removeComponent(HoveredShip, godEntity)}
      isSelected={selected}
      isHovered={isHovered}
      key={`move-selection-${shipEntity}`}
    >
      <ShipCard shipEntity={shipEntity} />
      <ActionStatus shipEntity={shipEntity} />
    </ShipContainer>
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

const SpecialText = styled.span`
  font-size: 1.5rem;
  align-text: center;
`;
