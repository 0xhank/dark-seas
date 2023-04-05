import { useEntityQuery } from "@latticexyz/react";
import { EntityIndex, Has, HasValue, getComponentValueStrict } from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import styled from "styled-components";
import { ShipPrototype } from "../../game/types";
import { useHome } from "../../mud/providers/HomeProvider";
import { useOwner } from "../../mud/providers/OwnerProvider";
import { Container } from "../../styles/global";
import { world } from "../../world";
import { ShipButton } from "./ShipButton";

export function YourPort() {
  const {
    components: { ShipPrototype, OwnedBy },
  } = useHome();
  const ownerEntity = useOwner();
  const ownerId = world.entities[ownerEntity];
  const fleetEntities = useEntityQuery([Has(ShipPrototype), HasValue(OwnedBy, { value: ownerId })]);

  function decodeShipPrototype(prototypeEntity: EntityIndex) {
    const shipPrototypeDataEncoded = getComponentValueStrict(ShipPrototype, prototypeEntity).value;

    const reformattedData = "0x" + shipPrototypeDataEncoded.slice(66);

    const [price, length, maxHealth, speed, rawCannons, name] = abi.decode(
      [
        "uint32 price",
        "uint32 length",
        "uint32 maxHealth",
        "uint32 speed",
        "tuple(uint32 rotation,uint32 firepower,uint32 range)[] cannons",
        "string name",
      ],
      reformattedData
    );

    const prototype: ShipPrototype = {
      maxHealth,
      speed,
      cannons: rawCannons,
      price,
      length,
      name,
    };
    return prototype;
  }
  const fleet = fleetEntities.map((ship) => ({
    entity: ship,
    ...decodeShipPrototype(ship),
  }));
  return (
    <Container style={{ width: "auto", flex: 1 }}>
      <div style={{ fontSize: "1.5rem" }}>Your Port</div>
      <ShipButtons>
        {fleet.map((ship, index) => (
          <ShipButton prototype={ship} />
        ))}
      </ShipButtons>
    </Container>
  );
}
const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: auto;
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
