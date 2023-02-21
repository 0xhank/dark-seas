import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage, colors, OptionButton } from "../../styles/global";

export function ShipSelect({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype },
    godEntity,
  } = useMUD();

  const prototypeEntities = [...getComponentEntities(ShipPrototype)];

  const prototypes = prototypeEntities.map((prototypeEntity) => {
    const shipPrototypeDataEncoded = getComponentValueStrict(ShipPrototype, prototypeEntity).value;

    const reformattedData = "0x" + shipPrototypeDataEncoded.slice(66);

    const [price, length, maxHealth, speed, rawCannons] = abi.decode(
      [
        "uint32 price",
        "uint32 length",
        "uint32 maxHealth",
        "uint32 speed",
        "tuple(uint32 rotation,uint32 firepower,uint32 range)[] cannons",
      ],
      reformattedData
    );

    return {
      entity: prototypeEntity,
      price,
      length,
    };
  });
  return (
    <SelectShipContainer style={{ flex, height: "100%" }}>
      <Title>Select Ships</Title>
      <ShipButtons>
        {prototypes.map((p) => {
          return (
            <OptionButton
              key={`shipPrototype-${p.entity}`}
              onClick={() => {}}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                minHeight: `${5 * p.length}px`,
                padding: "5px",
                direction: "ltr",
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
                      maxWidth: `${3.5 * p.length}px`,
                    }}
                  />
                </BoxImage>
              </BoxContainer>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
                <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>price</p>
                <Title style={{ lineHeight: "2.5rem" }}>{p.price}</Title>
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
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
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
