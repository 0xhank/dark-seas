import { GodID } from "@latticexyz/network";
import { EntityIndex, getComponentValue, getComponentValueStrict, setComponent } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import styled from "styled-components";
import { ActionImg, ActionNames, Layers, MoveCard, Phase, Wind } from "../../../../types";
import { arrowImg, getFinalMoveCard } from "../../../../utils/directions";
import { SelectionType } from "../../../phaser/constants";
import { colors, InternalContainer } from "../../styles/global";
import { ShipCard } from "./ShipCard";

export const YourShip = ({
  layers,
  ship,
  selectedShip,
  wind,
  selection,
  phase,
}: {
  layers: Layers;
  ship: EntityIndex;
  selectedShip: EntityIndex | undefined;
  wind: Wind;
  selection: SelectionType;
  phase: Phase;
}) => {
  const {
    network: {
      components: {
        SailPosition,
        Rotation,
        Position,
        Health,
        CrewCount,
        Firepower,
        OnFire,
        Leak,
        DamagedMast,
        MoveCard,
      },
      world,
    },
    phaser: {
      components: { SelectedMove, SelectedActions, SelectedShip, Selection },
      scenes: {
        Main: { camera },
      },
      positions,
    },
  } = layers;

  const selectShip = (ship: EntityIndex, position: Coord) => {
    camera.setZoom(1);
    camera.centerOn(position.x * positions.posWidth, position.y * positions.posHeight + 400);

    setComponent(SelectedShip, GodEntityIndex, { value: ship });
  };

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  const sailPosition = getComponentValueStrict(SailPosition, ship).value;
  const rotation = getComponentValueStrict(Rotation, ship).value;
  const position = getComponentValueStrict(Position, ship);
  const health = getComponentValueStrict(Health, ship).value;
  const moveCardEntity = getComponentValue(SelectedMove, ship);
  const isSelected = selectedShip == ship;
  const shipActions = getComponentValue(SelectedActions, ship)?.value;

  const SelectMoveButton = () => {
    if (!moveCardEntity) {
      return (
        <SelectShip
          isSelected={isSelected}
          onClick={() => {
            if (health == 0 || sailPosition == 0) return;
            selectShip(ship, position);
            setComponent(Selection, GodEntityIndex, { value: SelectionType.Move });
          }}
        >
          {sailPosition == 0 ? "Cannot move with broken sail" : "Stage Move"}
        </SelectShip>
      );
    }

    let moveCard = getComponentValueStrict(MoveCard, moveCardEntity.value as EntityIndex) as MoveCard;

    moveCard = getFinalMoveCard(moveCard, rotation, sailPosition, wind);

    const imageUrl = arrowImg(moveCard.rotation);

    return (
      <SelectShip
        isSelected={isSelected}
        onClick={() => {
          selectShip(ship, position);
        }}
      >
        <img
          src={imageUrl}
          style={{
            height: "35px",
            width: "35px",
            objectFit: "scale-down",
            transform: `rotate(${rotation + 90}deg)`,
          }}
        />
        <p>
          {moveCard.distance}M / {Math.round((moveCard.direction + rotation) % 360)}º
        </p>
      </SelectShip>
    );
  };

  const ActionButton = ({ selectionType, actionIndex }: { selectionType: SelectionType; actionIndex: number }) => {
    const action = shipActions ? shipActions[actionIndex] : undefined;
    return (
      <SelectShip
        isSelected={SelectionType[selectionType] == SelectionType[selection] && isSelected}
        onClick={() => {
          if (health == 0) return;
          setComponent(Selection, GodEntityIndex, { value: selectionType });
        }}
        key={`action-button-${ship}-${selectionType}`}
        style={{ flex: 1, width: "100%" }}
      >
        {action !== undefined && action !== -1 ? (
          <>
            <img
              src={ActionImg[action]}
              style={{
                height: "35px",
                width: "35px",
                objectFit: "scale-down",
                filter: "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)",
              }}
            />
            <p style={{ lineHeight: "1rem" }}>{ActionNames[action]}</p>
          </>
        ) : (
          <p style={{ fontSize: "1rem", lineHeight: "1rem" }}>Stage Action</p>
        )}
      </SelectShip>
    );
  };

  return (
    <YourShipContainer
      onClick={() => health !== 0 && selectShip(ship, position)}
      isSelected={isSelected}
      key={`move-selection-${ship}`}
    >
      <ShipCard layers={layers} ship={ship} />
      {phase == Phase.Commit ? (
        <SelectMoveButton />
      ) : phase == Phase.Action ? (
        <ActionButtons>
          <ActionButton selectionType={SelectionType.Action1} actionIndex={0} />
          <ActionButton selectionType={SelectionType.Action2} actionIndex={1} />
        </ActionButtons>
      ) : null}
    </YourShipContainer>
  );
};

const SelectShip = styled.div<{ isSelected?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  color: ${colors.darkBrown};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? colors.white : colors.thickGlass}`};
  }

  padding: 3;
  line-height: 30px;
  background: ${({ isSelected }) => `${isSelected ? colors.thickGlass : colors.glass}`};
  width: 95%;
  border: 1px solid ${colors.gold};
  height: 60px;
`;

const YourShipContainer = styled(InternalContainer)`
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  min-width: 150px;
  flex: 1;
  height: auto;
  cursor: pointer;

  :hover {
    background: ${({ isSelected }) => `${isSelected ? colors.lightGold : colors.thickGlass}`};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  gap: 6px;
  line-height: 20px;
`;
