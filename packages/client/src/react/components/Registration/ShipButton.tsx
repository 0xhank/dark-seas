import { useComponentValue } from "@latticexyz/react";
import { EntityIndex, removeComponent, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage, colors, OptionButton } from "../../styles/global";

export function ShipButton({ prototypeEntity }: { prototypeEntity: EntityIndex }) {
  const {
    components: { ActiveShip, Length, Booty, Name },
    godEntity,
  } = useMUD();

  const length = useComponentValue(Length, prototypeEntity, { value: 0 }).value;
  const price = useComponentValue(Booty, prototypeEntity, { value: 0 }).value;
  const name = useComponentValue(Name, prototypeEntity, { value: "" }).value;

  const activeShip = useComponentValue(ActiveShip, godEntity)?.value;
  const handleSelection = () => {
    if (prototypeEntity == activeShip) {
      removeComponent(ActiveShip, godEntity);
    } else {
      setComponent(ActiveShip, godEntity, { value: prototypeEntity });
    }
  };

  return (
    <OptionButton
      isSelected={activeShip == prototypeEntity}
      onClick={handleSelection}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: `${7 * length}px`,
        padding: "18px",
        direction: "ltr",
        marginLeft: "6px",
        position: "relative",
        width: "100%",
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
