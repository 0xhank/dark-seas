import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { CannonPrototype } from "../../../types";
import { Button } from "../../styles/global";

export function ShipSelect({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype },
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
    const cannons = rawCannons.map((cannon: [any, any, any]) => {
      const [rotation, firepower, range] = cannon;
      return {
        rotation,
        firepower,
        range,
      };
    }) as CannonPrototype[];

    return {
      entity: prototypeEntity,
      price,
      length,
      maxHealth,
      speed,
      cannons,
    };
  });
  return (
    <SelectShipContainer style={{ flex }}>
      <Title>Select Ships</Title>
      <ShipButtons>
        {prototypes.map((p) => (
          <Button key={`shipPrototype-${p.entity}`} onClick={() => {}}>
            <p>price: {p.price}</p>
            {/* <p>length: {p.length}</p>
          <p>max health: {p.maxHealth}</p>
          <p>speed: {p.speed}</p>
          {p.cannons.map((cannon, idx) => {
            return (
              <div>
                cannon {idx}
                <p>range: {cannon.range}</p>
                <p>range: {cannon.firepower}</p>
                <p>range: {cannon.rotation}</p>
              </div>
            );
          })} */}
          </Button>
        ))}
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
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 8px;
  width: 100%;
`;

const Title = styled.p`
  font-size: 3rem;
  line-height: 4rem;
`;
