import { EntityIndex, getComponentEntities, getComponentValue } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Container } from "../../styles/global";
import { ShipButton } from "./ShipButton";

export function AvailableShips({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype, Booty },
  } = useMUD();

  const prototypes = [...getComponentEntities(ShipPrototype)]
    .map((entity) => ({
      entity: entity as EntityIndex,
      price: getComponentValue(Booty, entity)?.value || 0,
    }))
    .sort((a, b) => Number(a.price) - Number(b.price));

  return (
    <Container style={{ flex, overflow: "none" }}>
      <Title>Available Ships</Title>
      <ShipButtons>
        {prototypes.map((prototypeEntity) => (
          <Fragment key={`available-ship-${prototypeEntity.entity}`}>
            <ShipButton prototypeEntity={prototypeEntity.entity} />
          </Fragment>
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

const Title = styled.p`
  font-size: 2.5rem;
  line-height: 3rem;
`;
