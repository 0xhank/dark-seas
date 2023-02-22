import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, removeComponent, setComponent } from "@latticexyz/recs";
import { ReactNode } from "react";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage, colors, OptionButton } from "../../styles/global";

export function ShipButton({ prototypeEntity, children }: { prototypeEntity: EntityIndex; children?: ReactNode }) {
  const {
    components: { ActiveShip },
    godEntity,
    utils: { decodeShipPrototype },
  } = useMUD();

  const { length, price, name } = decodeShipPrototype(prototypeEntity);

  const activeShip = useComponentValue(ActiveShip, godEntity)?.value;
  console.log("active ship outside:", activeShip);
  const handleSelection = () => {
    console.log("active ship:", activeShip);
    console.log("ship:", prototypeEntity);
    if (prototypeEntity == activeShip) {
      console.log("hello");
      removeComponent(ActiveShip, godEntity);
    } else {
      setComponent(ActiveShip, godEntity, { value: prototypeEntity });
    }
  };

  return (
    <OptionButton
      isSelected={activeShip == prototypeEntity}
      key={`shipPrototype-${prototypeEntity}}`}
      onClick={handleSelection}
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
      <p style={{ width: "100%", textAlign: "right", marginRight: "12px" }}>{name}</p>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
        <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>price</p>
        <Title style={{ lineHeight: "2.5rem" }}>{price}</Title>
      </div>
      {children}
    </OptionButton>
  );
}

const Title = styled.p`
  font-size: 3rem;
  line-height: 4rem;
`;

const BoxContainer = styled.div`
  display: flex;
  position: relative;
`;
