import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, getComponentEntities, removeComponent, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage, colors, OptionButton } from "../../styles/global";

export function ShipSelect({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype, ActiveShip },
    godEntity,
    utils: { decodeShipPrototype },
  } = useMUD();

  const prototypeEntities = [...getComponentEntities(ShipPrototype)];

  const activeShip = useComponentValue(ActiveShip, godEntity)?.value;

  const handleSelection = (entity: EntityIndex) => {
    if (entity == activeShip) {
      removeComponent(ActiveShip, godEntity);
    } else {
      setComponent(ActiveShip, godEntity, { value: entity });
    }
  };

  return (
    <SelectShipContainer style={{ flex, height: "100%" }}>
      <Title>Available Ships</Title>
      <ShipButtons>
        {prototypeEntities.map((prototypeEntity) => {
          const { length, price } = decodeShipPrototype(prototypeEntity);
          return (
            <OptionButton
              isSelected={activeShip == prototypeEntity}
              key={`shipPrototype-${prototypeEntity}}`}
              onClick={() => handleSelection(prototypeEntity)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                minHeight: `${5 * length}px`,
                padding: "18px",
                direction: "ltr",
                marginLeft: "6px",
              }}
            >
              <BoxContainer>
                <BoxImage length={length}>
                  <img
                    src={ShipImages[getShipSprite(godEntity, 1, 1, true)]}
                    style={{
                      objectFit: "scale-down",
                      left: "50%",
                      position: "absolute",
                      top: "50%",
                      margin: "auto",
                      transform: `rotate(270deg) translate(-50%, 0%)`,
                      transformOrigin: `top left`,
                      maxWidth: `${3.5 * length}px`,
                    }}
                  />
                </BoxImage>
              </BoxContainer>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
                <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>price</p>
                <Title style={{ lineHeight: "2.5rem" }}>{price}</Title>
              </div>
            </OptionButton>
          );
        })}
      </ShipButtons>
    </SelectShipContainer>
  );
}

const SelectShipContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: none;
`;

const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 8px;
  width: 100%;
  height: 100%;
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Title = styled.p`
  font-size: 3rem;
  line-height: 4rem;
`;

const BoxContainer = styled.div`
  display: flex;
  position: relative;
  margin: 6px;
`;
